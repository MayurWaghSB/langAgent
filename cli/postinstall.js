/**
 * Postinstall Script
 * Runs after `npm install -g dev-agent`.
 * Shows a welcome message with setup instructions.
 * NOTE: Uses only built-in Node.js modules (no dependencies available yet during install).
 */

console.log("");
console.log("  ╔══════════════════════════════════════╗");
console.log("  ║   🤖 Dev-Agent installed!             ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");
console.log("  Quick start:");
console.log("    1. Run setup to configure API keys:");
console.log("       dev-agent setup");
console.log("");
console.log("    2. Start using it:");
console.log('       dev-agent ask "What is a closure?"');
console.log("       dev-agent chat");
console.log("");
