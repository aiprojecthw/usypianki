// Podpis wydania (klucz przesyłania do Google Play) dla buildów AAB na GitHubie.
//
// Klucz NIE jest w repozytorium. Workflow „Android – AAB do Google Play” odtwarza go
// z sekretów GitHuba i ustawia zmienne środowiskowe:
//   UPLOAD_STORE_FILE, UPLOAD_STORE_PASSWORD, UPLOAD_KEY_ALIAS, UPLOAD_KEY_PASSWORD
// Bez tych zmiennych (testowy APK, build lokalny) wydanie podpisuje się kluczem
// debug, jak dotąd.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// usypianki: release signing';

const RELEASE_SIGNING = `
        release {
            ${MARKER}
            if (System.getenv('UPLOAD_STORE_FILE')) {
                storeFile file(System.getenv('UPLOAD_STORE_FILE'))
                storePassword System.getenv('UPLOAD_STORE_PASSWORD')
                keyAlias System.getenv('UPLOAD_KEY_ALIAS')
                keyPassword System.getenv('UPLOAD_KEY_PASSWORD')
            }
        }`;

function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  const debugBlock = /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/;
  if (!debugBlock.test(gradle)) {
    throw new Error('with-release-signing: nie znaleziono signingConfigs { debug { … } } w app/build.gradle');
  }
  let out = gradle.replace(debugBlock, `$1${RELEASE_SIGNING}`);

  const releaseUsesDebug = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s*=?\s*signingConfigs\.debug/;
  if (!releaseUsesDebug.test(out)) {
    throw new Error('with-release-signing: nie znaleziono signingConfig w buildTypes.release');
  }
  out = out.replace(
    releaseUsesDebug,
    "$1signingConfig = System.getenv('UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
  );
  return out;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};

module.exports.addReleaseSigning = addReleaseSigning;
