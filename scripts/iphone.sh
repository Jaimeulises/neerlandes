#!/bin/sh
# Compila Stap como app de iPhone y la instala por cable en el iPhone conectado.
#
# Uso: npm run iphone
#
# Hace falta: Xcode con una cuenta de Apple iniciada (vale la gratuita) y el iPhone conectado,
# desbloqueado, con el modo de desarrollador activo y este ordenador marcado como de confianza.
# Con la cuenta gratuita la instalación caduca a los siete días: se vuelve a lanzar esto y el
# progreso se conserva, porque se instala encima de la misma app.
#
# El equipo de firma sale del certificado «Apple Development» del llavero, así no se guarda en el
# repositorio. Se puede forzar con EQUIPO_APPLE=XXXXXXXXXX, y el iPhone con IPHONE=<identificador>.
set -eu

cd "$(dirname "$0")/.."

equipo="${EQUIPO_APPLE:-$(security find-certificate -c 'Apple Development' -p 2>/dev/null |
  openssl x509 -noout -subject -nameopt multiline 2>/dev/null |
  awk -F' = ' '/organizationalUnitName/ { print $2; exit }')}"
if [ -z "$equipo" ]; then
  echo "No encuentro un certificado «Apple Development». Inicia sesión en Xcode (Ajustes, Cuentas) y vuelve a probar." >&2
  exit 1
fi

lista="$(mktemp)"
trap 'rm -f "$lista"' EXIT
xcrun devicectl list devices --json-output "$lista" >/dev/null
iphone="${IPHONE:-$(node -e '
  const { result } = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
  const conectado = result.devices.find((d) =>
    d.hardwareProperties?.reality === "physical" &&
    d.hardwareProperties?.platform === "iOS" &&
    d.connectionProperties?.tunnelState === "connected");
  if (conectado) console.log(conectado.hardwareProperties.udid);
' "$lista")}"
if [ -z "$iphone" ]; then
  echo "No veo ningún iPhone conectado. Conéctalo por cable, desbloquéalo y vuelve a probar." >&2
  exit 1
fi

app="$(node -p 'require("./capacitor.config.json").appId')"
productos="ios/App/build/Build/Products/Release-iphoneos"

# Cuándo caduca el perfil de firma: la pantalla de inicio lo avisa (src/estado/firma.ts).
caducidad() {
  security cms -D -i "$1" 2>/dev/null | plutil -extract ExpirationDate raw -o - - 2>/dev/null || true
}

# El perfil que Xcode ya tiene para esta app, si lo hay (el más nuevo). Si al compilar sale otro, se corrige abajo.
perfil_previsto() {
  for p in "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/"*.mobileprovision; do
    [ -f "$p" ] || continue
    id="$(security cms -D -i "$p" 2>/dev/null | plutil -extract Entitlements.application-identifier raw -o - - 2>/dev/null || true)"
    case "$id" in *".$app") caducidad "$p" ;; esac
  done | sort | tail -n 1
}

escribir_firma() {
  printf '{ "caduca": "%s" }\n' "$1" > ios/App/App/public/firma.json
}

compilar() {
  xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
    -destination "id=$iphone" -derivedDataPath ios/App/build \
    -allowProvisioningUpdates -allowProvisioningDeviceRegistration \
    DEVELOPMENT_TEAM="$equipo" CODE_SIGN_STYLE=Automatic -quiet build
}

npm run build
npx cap sync ios
prevista="$(perfil_previsto)"
escribir_firma "$prevista"
compilar
real="$(caducidad "$productos/App.app/embedded.mobileprovision")"
if [ -n "$real" ] && [ "$real" != "$prevista" ]; then
  # Xcode ha hecho un perfil nuevo: se apunta su fecha y se recompila (rápido, ya está casi todo hecho).
  escribir_firma "$real"
  compilar
fi
xcrun devicectl device install app --device "$iphone" "$productos/App.app"
# Abrirla solo funciona con el iPhone desbloqueado; si no se puede, ya está instalada igualmente.
xcrun devicectl device process launch --device "$iphone" "$app" >/dev/null 2>&1 || true
echo "Stap instalada en el iPhone. La firma caduca: ${real:-$prevista}."
