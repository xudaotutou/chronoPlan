// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::governance::multisig
// Version: v1.0.0
// Description: Multi-signature governance implementation

use starknet::ContractAddress;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use crate::domain::traits::governance::IGovernance;

const GOVERNANCE_TYPE: felt252 = 'MULTISIG';
const VERSION: felt252 = 'v1.0.0';

#[starknet::contract]
mod MultisigGovernance {
    use super::*;

    #[storage]
    struct Storage {
        threshold: u32,
        signer_1: ContractAddress,
        signer_2: ContractAddress,
        signer_3: ContractAddress,
        signer_count: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MultisigInitialized: MultisigInitialized,
        ThresholdUpdated: ThresholdUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct MultisigInitialized {
        threshold: u32,
        signer_1: ContractAddress,
        signer_2: ContractAddress,
        signer_3: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct ThresholdUpdated {
        old_threshold: u32,
        new_threshold: u32,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        threshold: u32,
        signer_1: ContractAddress,
        signer_2: ContractAddress,
        signer_3: ContractAddress,
    ) {
        assert(threshold > 0 && threshold <= 3, 'Invalid threshold');
        assert(signer_1.into() != 0, 'Invalid signer 1');
        assert(signer_2.into() != 0, 'Invalid signer 2');
        assert(signer_3.into() != 0, 'Invalid signer 3');
        assert(
            signer_1 != signer_2 && signer_2 != signer_3 && signer_1 != signer_3,
            'Duplicate signers',
        );

        self.threshold.write(threshold);
        self.signer_1.write(signer_1);
        self.signer_2.write(signer_2);
        self.signer_3.write(signer_3);
        self.signer_count.write(3);

        self.emit(MultisigInitialized { threshold, signer_1, signer_2, signer_3 });
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn check_is_signer(self: @ContractState, address: ContractAddress) -> bool {
            address == self.signer_1.read()
                || address == self.signer_2.read()
                || address == self.signer_3.read()
        }
    }

    #[abi(embed_v0)]
    impl GovernanceImpl of IGovernance<ContractState> {
        fn is_governance(self: @ContractState, caller: ContractAddress) -> bool {
            self.check_is_signer(caller)
        }

        fn governance_type(self: @ContractState) -> felt252 {
            GOVERNANCE_TYPE
        }
    }

    #[abi(embed_v0)]
    impl MultisigActions of super::IMultisigActions<ContractState> {
        fn set_threshold(ref self: ContractState, new_threshold: u32) {
            let caller = starknet::get_caller_address();
            assert(self.check_is_signer(caller), 'Caller is not a signer');
            assert(new_threshold > 0 && new_threshold <= 3, 'Invalid threshold');
            let old = self.threshold.read();
            if old != new_threshold {
                self.threshold.write(new_threshold);
                self.emit(ThresholdUpdated { old_threshold: old, new_threshold });
            }
        }

        fn get_threshold(self: @ContractState) -> u32 {
            self.threshold.read()
        }

        fn get_signer(self: @ContractState, index: u32) -> ContractAddress {
            if index == 0 {
                self.signer_1.read()
            } else if index == 1 {
                self.signer_2.read()
            } else if index == 2 {
                self.signer_3.read()
            } else {
                0.try_into().unwrap()
            }
        }

        fn get_signer_count(self: @ContractState) -> u32 {
            self.signer_count.read()
        }
    }
}

#[starknet::interface]
pub trait IMultisigActions<TContractState> {
    fn set_threshold(ref self: TContractState, new_threshold: u32);
    fn get_threshold(self: @TContractState) -> u32;
    fn get_signer(self: @TContractState, index: u32) -> ContractAddress;
    fn get_signer_count(self: @TContractState) -> u32;
}
