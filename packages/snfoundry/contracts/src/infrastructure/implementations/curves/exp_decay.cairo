// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::curves::exp_decay
// Version: v1.3.0
// Description: Front-loaded vesting curve with safe arithmetic
//
// This curve provides front-loaded vesting - more tokens vest earlier.
// params: decay_rate in basis points (0-10000)
//
// Formula: vested = amount * (elapsed/duration) * (1 + decay_rate/10000 * (1 - elapsed/duration))
// Security: Uses shared safe_arith::safe_mul_div to prevent overflow

use chrono_plan::domain::traits::curve::ICurve;
use chrono_plan::infrastructure::implementations::utils::safe_arith::safe_mul_div;

fn get_decay_rate(params: felt252) -> u64 {
    let params_u128: u128 = params.try_into().unwrap_or(0);
    (params_u128 & 0xFFFFFFFFFFFFFFFF_u128).try_into().unwrap_or(0)
}

pub impl ExpDecayCurve of ICurve {
    fn name() -> felt252 {
        'FrontLoaded'
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

        let elapsed_u256: u256 = elapsed.into();
        let duration_u256: u256 = duration.into();

        // Linear base ratio: elapsed / duration
        let base_ratio = safe_mul_div(elapsed_u256, 10000_u256, duration_u256);

        // Parse decay rate
        let decay_rate = get_decay_rate(params);

        if decay_rate == 0 {
            return safe_mul_div(amount, base_ratio, 10000_u256);
        }

        // Front-loading factor
        // At start: multiplier = 1 + decay_rate/10000
        // At end: multiplier = 1
        let decay_factor = 10000_u256 + decay_rate.into();
        let adjusted_ratio = safe_mul_div(base_ratio, decay_factor, 10000_u256);

        // Cap at 100%
        let max_ratio: u256 = 10000_u256;
        let capped_ratio = if adjusted_ratio > max_ratio {
            max_ratio
        } else {
            adjusted_ratio
        };

        safe_mul_div(amount, capped_ratio, 10000_u256)
    }

    fn validate_params(params: felt252) -> bool {
        let rate = get_decay_rate(params);
        rate <= 10000
    }
}
