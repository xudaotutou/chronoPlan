// SPDX-License-Identifier: MIT
// Module: interfaces::i_schedule
// Version: v1.5.0
// Description: Schedule contract external interface

use chrono_plan::domain::types::schedule::PlanStatus;
use starknet::{ClassHash, ContractAddress};

#[starknet::interface]
pub trait ISchedule<TContractState> {
    // User Operations
    fn claim(ref self: TContractState);
    fn get_available(self: @TContractState) -> u256;
    fn get_status(self: @TContractState) -> PlanStatus;

    // Governance Operations
    fn close(ref self: TContractState, refund_address: ContractAddress);
    fn finalize(ref self: TContractState);

    // Query Operations
    fn get_recipient(self: @TContractState) -> ContractAddress;
    fn get_amount(self: @TContractState) -> u256;
    fn get_claimed(self: @TContractState) -> u256;
    fn get_plan_id(self: @TContractState) -> felt252;
    fn get_curve_name(self: @TContractState) -> felt252;
    fn get_governance_address(self: @TContractState) -> ContractAddress;
}

#[starknet::interface]
pub trait IUpgradeable<TContractState> {
    fn upgrade(ref self: TContractState, new_impl: ClassHash);
    fn get_implementation(self: @TContractState) -> ClassHash;
}
