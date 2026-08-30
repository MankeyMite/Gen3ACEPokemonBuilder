# PKHeX.Core browser-WASM feasibility spike

This isolated project proves whether pinned PKHeX.Core can validate the exact
encrypted 80-byte Gen III stored Pokémon produced by the existing JavaScript
builder. It is not connected to the application Generate flow or UI.

The JavaScript harness copies each 80-byte `Uint8Array`, uses Base64 only as a
lossless JS/.NET transport encoding, and passes the decoded bytes directly to
`new PK3(bytes)`. It does not decrypt, pad, or convert the Pokémon in JavaScript.

## Build and run

```powershell
node .\pkhex-validator\scripts\generate-fixtures.mjs
dotnet restore .\pkhex-validator\PkhexValidator.Browser.csproj --locked-mode
dotnet publish .\pkhex-validator\PkhexValidator.Browser.csproj -c Release
node .\qa-server.cjs
```

For the first restore, omit `--locked-mode` to create `packages.lock.json`.
The `wasm-tools` workload is required. AOT and trimming are deliberately
disabled for the feasibility baseline.

Run the static server with its working directory set to
`pkhex-validator\bin\Release\net10.0\publish\wwwroot`, or use any static server
that supplies `application/wasm` (the repository QA server's octet-stream
fallback is also accepted by current browsers).

Measure the published files with:

```powershell
.\pkhex-validator\scripts\measure-publish.ps1
```

The automated cold-browser proof uses an isolated Chrome profile and the Chrome
DevTools protocol:

```powershell
node .\pkhex-validator\scripts\run-browser-spike.mjs
```

## Build assets for the local builder UI

The feasibility harness remains intact. The main builder loads a local publish
of the same bridge from a dedicated Web Worker. From the repository root:

```powershell
.\pkhex-validator\scripts\publish-local.ps1
node .\qa-server.cjs
```

Then open `http://127.0.0.1:8012/`. The generated `pkhex-validator/dist`
directory is ignored by Git. The main site transfers a copied exact 80-byte
encrypted stored-Pokémon buffer to the worker; JavaScript uses Base64 only for
interop and does not decrypt, pad, or create a 100-byte party representation.
