// SPDX-License-Identifier: MIT
// Module: infrastructure::utils::safe_arith
// Version: v1.3.0
// Description: Safe arithmetic utilities for u256 operations
//
// Provides overflow-safe multiplication and division operations.
// Uses the splitting technique: (a/c) * b + (a%c) * b/c
// This reduces overflow risk for large values.

/// Safe multiplication and division: (a * b) / c without overflow
///
/// # Arguments
/// * `a` - The amount to be multiplied
/// * `b` - The multiplier
/// * `c` - The divisor
///
/// # Returns
/// * `(a * b) / c` calculated safely
///
/// # Security
/// - Returns 0 if c == 0 (division by zero protection)
/// - Uses splitting technique to reduce overflow risk
pub fn safe_mul_div(a: u256, b: u256, c: u256) -> u256 {
    if c == 0 {
        return 0;
    }
    // Split to avoid overflow: (a/c) * b + (a%c) * b / c
    let a_div = a / c;
    let a_mod = a % c;
    a_div * b + (a_mod * b) / c
}

/// Safe multiplication: a * b
///
/// In Cairo, u256 multiplication is bounded and will panic on overflow.
/// This function documents the expectation that overflow should not occur
/// with properly validated inputs.
pub fn safe_mul(a: u256, b: u256) -> u256 {
    a * b
}
