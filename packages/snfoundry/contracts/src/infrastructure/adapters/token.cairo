// SPDX-License-Identifier: MIT
// Module: infrastructure::adapters::token
// Version: v1.0.0
// Description: ERC20 token adapter - re-exports OpenZeppelin ERC20 interfaces and dispatchers
// Dependencies:
//   - openzeppelin_interfaces (specific package for interfaces)

// Re-export OpenZeppelin ERC20 interface for interacting with external tokens

// Re-export OpenZeppelin ERC20 dispatcher for external token calls
pub use openzeppelin_interfaces::token::erc20::{
    IERC20, IERC20Dispatcher as ERC20Dispatcher, IERC20DispatcherTrait as ERC20DispatcherTrait,
};
