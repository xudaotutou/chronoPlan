// SPDX-License-Identifier: MIT
// Module: domain::traits::curve
// Version: v1.0.0
// Description: Vesting curve mathematical interface

// Curve algorithm trait - stateless functions
pub trait ICurve {
    fn calculate(amount: u256, params: felt252, elapsed: u64, duration: u64) -> u256;

    fn validate_params(params: felt252) -> bool;

    fn name() -> felt252;

    fn version() -> felt252;
}
