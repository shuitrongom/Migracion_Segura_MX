const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to fix GoogleUtilities version conflict between
 * @react-native-google-signin (needs ~> 8.0) and react-native-mlkit (needs ~> 7.0)
 */
module.exports = function withGoogleUtilitiesFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');

        // Add pod 'GoogleUtilities' override at the end of the main target block, before the last 'end'
        if (!podfileContent.includes("pod 'GoogleUtilities'")) {
          // Find the last 'end' in the file and insert before it
          const lines = podfileContent.split('\n');
          const targetLineIndex = lines.findIndex(line => line.match(/^\s*target\s+/));
          
          if (targetLineIndex !== -1) {
            // Insert after the first line that contains 'use_expo_modules!'
            const useExpoIndex = lines.findIndex(line => line.includes('use_expo_modules!'));
            const insertIndex = useExpoIndex !== -1 ? useExpoIndex + 1 : targetLineIndex + 2;
            
            lines.splice(insertIndex, 0, "  pod 'GoogleUtilities', '~> 8.0'");
            podfileContent = lines.join('\n');
          }

          fs.writeFileSync(podfilePath, podfileContent);
        }
      }

      return config;
    },
  ]);
};
