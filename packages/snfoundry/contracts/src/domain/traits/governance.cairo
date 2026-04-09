// SPDX-License-Identifier: MIT
// Module: domain::traits::governance
// Version: v1.0.0
// Description: Governance interface for schedule authorization
//
// Supports any governance model:
//   - SINGLE_ADMIN: Single owner (EOA or contract)
//   - MULTISIG: Multi-signature wallet (Argent, Braavos, custom)
//   - DAO: Governor contract

use starknet::ContractAddress;

/// Governance interface - validates authorization for schedule operations
///
/// Any contract can implement this to become a governance module.
/// Schedule calls `is_governance(caller)` to validate authorization.
#[starknet::interface]
pub trait IGovernance<TContractState> {
    /// Check if caller is authorized for governance actions
    fn is_governance(self: @TContractState, caller: ContractAddress) -> bool;

    /// Get governance type identifier
    /// Returns: "SINGLE_ADMIN", "MULTISIG", "DAO"
    fn governance_type(self: @TContractState) -> felt252;
}

/// Governance type constants
pub mod governance_type {
    pub const SINGLE_ADMIN: felt252 = 'SINGLE_ADMIN';
    pub const MULTISIG: felt252 = 'MULTISIG';
    pub const DAO: felt252 = 'DAO';
}
