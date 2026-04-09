// SPDX-License-Identifier: MIT
// Module: infrastructure::implementations::curves::cliff
// Version: v1.3.0
// Description: Cliff vesting curve with safe arithmetic
//
// params: cliff_duration in seconds (lower 64 bits)
// Formula: 0 until cliff, then linear from cliff point to duration
// Security: Uses shared safe_arith::safe_mul_div with division-by-zero protection

use chrono_plan::domain::traits::curve::ICurve;
use chrono_plan::infrastructure::implementations::utils::safe_arith::safe_mul_div;

fn get_cliff_duration(params: felt252) -> u64 {
    let params_u128: u128 = params.try_into().unwrap_or(0);
    (params_u128 & 0xFFFFFFFFFFFFFFFF_u128).try_into().unwrap_or(0)
}

pub impl CliffCurve of ICurve {
    fn name() -> felt252 {
        'Cliff'
    }

    fn version() -> felt252 {
        'v1.3.0'
    }

    fn calculate(amount: u256, params: felt252, elapsed: u64, duration: u64) -> u256 {
        let cliff_duration = get_cliff_duration(params);

        // SECURITY: If cliff > duration, return full amount immediately
        if cliff_duration > duration {
            return amount;
        }

        if elapsed < cliff_duration {
            return 0;
        }

        if elapsed >= duration {
            return amount;
        }

        // After cliff, linear vesting from cliff point
        let time_after_cliff = elapsed - cliff_duration;
        let vesting_duration = duration - cliff_duration;

        if vesting_duration == 0 {
            return amount;
        }

        // Safe calculation: amount * time_after_cliff / vesting_duration
        // safe_mul_div includes division-by-zero protection
        let time_u256: u256 = time_after_cliff.into();
        let duration_u256: u256 = vesting_duration.into();
        safe_mul_div(amount, time_u256, duration_u256)
    }

    fn validate_params(params: felt252) -> bool {
        let cliff = get_cliff_duration(params);
        cliff > 0
    }
}
