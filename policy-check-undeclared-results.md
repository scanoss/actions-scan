5 undeclared component(s) were found.
Add the following snippet into your `sbom.json` file

```json
{
  "components": [
    {
      "purl": "pkg:github/scanoss/wfp"
    },
    {
      "purl": "pkg:github/scanoss/scanner.c"
    },
    {
      "purl": "pkg:npm/%40grpc/grpc-js"
    },
    {
      "purl": "pkg:npm/abort-controller"
    },
    {
      "purl": "pkg:npm/adm-zip"
    }
  ]
}
```

