// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::curves::linear
// Version: v1.3.0
// Description: Linear vesting curve with safe arithmetic
//
// Formula: vested = amount * elapsed / duration
// Security: Uses shared safe_arith::safe_mul_div to prevent overflow

use chrono_plan::domain::traits::curve::ICurve;
use chrono_plan::infrastructure::implementations::utils::safe_arith::safe_mul_div;

pub impl LinearCurve of ICurve {
    fn name() -> felt252 {
        'Linear'
    }

    fn version() -> felt252 {
        'v1.3.0'
    }

    fn calculate(amount: u256, params: felt252, elapsed: u64, duration: u64) -> u256 {
        if duration == 0 {
            return 0;
        }
        if elapsed == 0 {
            return 0;
        }
        if elapsed >= duration {
            return amount;
        }

        // Use shared safe_mul_div: (amount * elapsed) / duration
        let elapsed_u256: u256 = elapsed.into();
        let duration_u256: u256 = duration.into();
        safe_mul_div(amount, elapsed_u256, duration_u256)
    }

    fn validate_params(params: felt252) -> bool {
        true
    }
}
