import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {expect} from 'chai'
import {deployments, ethers} from 'hardhat'
import {RewardToken, Staking} from '../typechain-types'
import {deployContract} from './framework/contracts'

describe('Staking', () => {
    let staking: Staking
    let rewardToken: RewardToken

    let depositor1: SignerWithAddress
    let depositor2: SignerWithAddress
    before(async () => {
        const signers = await ethers.getSigners()
        depositor1 = signers[1]
        depositor2 = signers[2]
        await deployments.fixture()
        rewardToken = await deployContract<RewardToken>('RewardToken')
        staking = await deployContract<Staking>(
            'Staking',
            rewardToken.address,
            Math.floor(Date.now() / 1000) + 3600,
            Math.floor(Date.now() / 1000) + 7200
        )
    })

    it('test the deposit function', async () => {
        // should failt
        expect(
            await (
                await staking
                    .connect(depositor1)
                    .deposit({value: ethers.utils.parseEther('1')})
            ).wait()
        )

        expect(
            await (
                await staking
                    .connect(depositor2)
                    .deposit({value: ethers.utils.parseEther('1')})
            ).wait()
        )

        await ethers.provider.send('evm_increaseTime', [3700])

        await ethers.provider.send('evm_mine', [])

        await expect(
            staking
                .connect(depositor1)
                .deposit({value: ethers.utils.parseEther('1')})
        ).to.revertedWith('TOO_LATE')
    })

    it('test the reward accrual', async () => {
        await rewardToken.increaseAllowance(
            staking.address,
            ethers.utils.parseEther('100')
        )
        expect(staking.increaseRewards(ethers.utils.parseEther('100')))
    })

    it('test the claimAndHarvest', async () => {
        await expect(
            staking.connect(depositor1).claimAndHarvest()
        ).to.revertedWith('TOO_SOON')

        await ethers.provider.send('evm_increaseTime', [3600])

        expect(
            await (await staking.connect(depositor1).claimAndHarvest()).wait()
        )

        const balanceRewards = await rewardToken.balanceOf(depositor1.address)

        expect(balanceRewards).to.be.equal(ethers.utils.parseEther('50'))
    })
})
