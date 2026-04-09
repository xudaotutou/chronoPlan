// SPDX-License-Identifier: MIT
// Module: domain::traits::beneficiary
// Version: v1.0.0
// Description: Beneficiary interface for schedule recipients
//
// Supported beneficiary types:
//   - EOA: Externally Owned Account (no contract)
//   - AGENT: AI agent with callback capability
//   - CONTRACT: Smart contract wallet

use starknet::ContractAddress;

/// Beneficiary trait - implemented by recipients of schedule plans
#[starknet::interface]
pub trait IBeneficiary<TContractState> {
    /// Get beneficiary type identifier
    /// Returns: "EOA", "AGENT", "CONTRACT"
    fn beneficiary_type(self: @TContractState) -> felt252;

    /// Check if beneficiary supports auto-claim
    fn supports_auto_claim(self: @TContractState) -> bool;

    /// Notify beneficiary of a claim
    /// Called by Schedule after tokens are transferred
    fn on_claim_received(self: @TContractState, amount: u256, schedule_address: ContractAddress);
}

/// Beneficiary type constants
pub mod beneficiary_type {
    pub const EOA: felt252 = 'EOA';
    pub const AGENT: felt252 = 'AGENT';
    pub const CONTRACT: felt252 = 'CONTRACT';
}
