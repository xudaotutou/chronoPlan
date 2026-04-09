// SPDX-License-Identifier: MIT
// Module: infrastructure::adapters::time
// Version: v1.0.0
// Responsibility: L2 Engineer (Starknet specific)
// Last Modified: 2026-04-06
// Description: Time source adapter interface

/// Time source trait - abstraction for time-related operations
#[starknet::interface]
pub trait ITimeSource<TContractState> {
    fn now(self: @TContractState) -> u64;
    fn block_number(self: @TContractState) -> u64;
    fn is_valid_timestamp(self: @TContractState, timestamp: u64) -> bool;
    fn time_until(self: @TContractState, target: u64) -> u64;
    fn has_passed(self: @TContractState, target: u64) -> bool;
}
