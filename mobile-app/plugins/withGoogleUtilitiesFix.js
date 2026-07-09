const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to fix GoogleUtilities version conflict between
 * @react-native-google-signin (needs ~> 8.0) and react-native-mlkit (needs ~> 7.0)
 * Forces GoogleUtilities to use version 8.x which is backward compatible.
 */
module.exports = function withGoogleUtilitiesFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');

        // Add pre_install hook to force GoogleUtilities version
        const preInstallHook = `
pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name == 'GoogleUtilities' || pod.name.start_with?('GoogleUtilities/')
      def pod.build_type
        Pod::BuildType.static_library
      end
    end
  end
end

`;
        // Add post_install modification to resolve version conflict
        if (!podfileContent.includes("pod 'GoogleUtilities'")) {
          // Insert after 'use_react_native' or at the beginning of the target block
          podfileContent = podfileContent.replace(
            /use_react_native!/,
            `use_react_native!\n\n  # Fix GoogleUtilities version conflict\n  pod 'GoogleUtilities', '~> 8.0'`
          );

          fs.writeFileSync(podfilePath, podfileContent);
        }
      }

      return config;
    },
  ]);
};
