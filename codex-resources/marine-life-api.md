# Marine Life API Resources

Last researched: 2026-05-24

This Codex resource summarizes four marine data/API resources, with the practical shape of each API: what goes in, what comes out, and quick `curl` commands for testing.

## 1. WoRMS REST API

Sources:

- [WoRMS REST Swagger UI](https://www.marinespecies.org/rest/)
- [WoRMS OpenAPI YAML](https://www.marinespecies.org/rest/api-docs/openapi.yaml)

Base URL:

```text
https://www.marinespecies.org/rest
```

Auth:

- No API key required.

Best For:

- Marine taxonomy lookup
- Scientific name to AphiaID lookup
- AphiaID to full taxon record
- Synonyms, classifications, vernacular names, distributions, attributes, sources, and external identifiers

Common Inputs:

- Scientific name: `Solea solea`, `Mytilus edulis`
- AphiaID: `127160`, `140480`
- External identifiers: TSN, FishBase ID, NCBI taxonomy ID, LSID, etc.
- Query params:
  - `marine_only=true|false`
  - `extant_only=true|false`
  - `like=true|false`
  - `offset=1`
  - `type=tsn|fishbase|ncbi|bold|iucn|lsid|algaebase|dyntaxa|gisd`

Common Outputs:

- Plain integer AphiaID for exact name lookup
- JSON object for one taxon record
- JSON arrays for search results, synonyms, vernacular names, distributions, sources, and attributes
- XML is also supported by the API, but JSON is the easiest default for app testing

Example: Get AphiaID From Scientific Name

```bash
curl 'https://www.marinespecies.org/rest/AphiaIDByName/Solea%20solea?marine_only=true&extant_only=true'
```

Expected output shape:

```json
127160
```

Example: Get Full Taxon Record By AphiaID

```bash
curl 'https://www.marinespecies.org/rest/AphiaRecordByAphiaID/127160'
```

Expected output shape:

```json
{
  "AphiaID": 127160,
  "scientificname": "Solea solea",
  "authority": "(Linnaeus, 1758)",
  "status": "accepted",
  "rank": "Species",
  "valid_AphiaID": 127160,
  "valid_name": "Solea solea",
  "kingdom": "Animalia",
  "phylum": "Chordata",
  "class": "Teleostei",
  "order": "Pleuronectiformes",
  "family": "Soleidae",
  "genus": "Solea",
  "lsid": "urn:lsid:marinespecies.org:taxname:127160",
  "isMarine": 1
}
```

Example: Search Records By Scientific Name

```bash
curl 'https://www.marinespecies.org/rest/AphiaRecordsByName/Mytilus%20edulis?like=false&marine_only=true&extant_only=true'
```

Example: Get Classification Tree

```bash
curl 'https://www.marinespecies.org/rest/AphiaClassificationByAphiaID/140480'
```

Example: Get Synonyms

```bash
curl 'https://www.marinespecies.org/rest/AphiaSynonymsByAphiaID/140480'
```

Example: Get Vernacular/Common Names

```bash
curl 'https://www.marinespecies.org/rest/AphiaVernacularsByAphiaID/140480'
```

Example: Get Distribution Records

```bash
curl 'https://www.marinespecies.org/rest/AphiaDistributionsByAphiaID/140480'
```

## 2. MarLIN / MBA API

Sources:

- [MarLIN Data Products](https://www.marlin.ac.uk/data-extract)
- [MarLIN API Help](https://api.mba.ac.uk/help_marlin)

Base URL:

```text
https://api.mba.ac.uk/marlin
```

Auth:

- No API key required.

Best For:

- Marine species and habitat records around the British Isles
- MarESA sensitivity-to-pressure assessments
- Species and habitat bibliographies
- Linking species to WoRMS AphiaIDs and NBN keys

Common Inputs:

- Species ID: `1722`
- AphiaID: `141433`
- NBN key: `NHMSYS0021054811`
- Species name: `abra alba`
- Habitat ID: `2`
- JNCC habitat code: `LR.MLR.BF.Rho`
- EUNIS habitat code: `MA1245`
- Query params:
  - Species endpoints: `type=species|aphia|nbm|name`
  - Habitat endpoints: `type=habitat|jncc|eunis`
  - `like=true`
  - `withevidence=true`
  - `withbio=false`
  - `withphys=false`
  - `withhydro=false`
  - `withchem=false`
  - `withcc=false`

Common Outputs:

- JSON arrays
- Species records with fields like `speciesID`, `taxonomyName`, `synonymCommonName`, `taxonomyAuthority`, `aphiaID`, `NBNVersionKey`, `speciesReviewDate`, `url`
- Habitat records with JNCC/EUNIS codes and names
- Pressure records with `Pressure`, `Resistance`, `Resilience`, `Sensitivity`, evidence quality/applicability/concordance fields, review dates, and URLs
- Bibliography records with `referenceShort` and `referenceFull`

Example: Get One Species By MarLIN Species ID

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/species/1722'
```

Expected output shape:

```json
[
  {
    "speciesID": "1722",
    "taxonomyName": "Abra alba",
    "synonymCommonName": "White furrow shell",
    "taxonomyAuthority": "(W. Wood, 1802)",
    "aphiaID": "141433",
    "NBNVersionKey": "NHMSYS0021054811",
    "speciesReviewDate": "2007-07-03 00:00:00",
    "url": "https://www.marlin.ac.uk/species/detail/1722"
  }
]
```

Example: Get Species By AphiaID

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/species/141433?type=aphia'
```

Example: Fuzzy/Partial Species Name Search

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/species/abra?type=name&like=true'
```

Example: Get Species Pressure Sensitivity

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/speciespressures/1519'
```

Example: Include Evidence In Species Pressure Sensitivity

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/speciespressures/1519?withevidence=true'
```

Example: Get Habitat By JNCC Code

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/habitats/LR.MLR.BF.Rho?type=jncc'
```

Example: Get Habitat Pressures And Exclude Chemical Pressures

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/habitatspressures/LR.MLR.BF.Rho?type=jncc&withchem=false'
```

Example: Species Bibliography

```bash
curl -L -H 'Accept: application/json' 'https://api.mba.ac.uk/marlin/speciesbibliographies/1722?type=species'
```

## 3. Global Fishing Watch APIs

Sources:

- [Global Fishing Watch API Overview](https://globalfishingwatch.org/our-apis/)
- [Global Fishing Watch API Documentation](https://globalfishingwatch.org/our-apis/documentation)

Base URL:

```text
https://gateway.api.globalfishingwatch.org/v3
```

Auth:

- Requires a Global Fishing Watch API access token.
- Send it as a Bearer token:

```bash
export GFW_TOKEN='paste-your-token-here'
```

```text
Authorization: Bearer $GFW_TOKEN
```

Best For:

- Vessel search and identity
- Apparent fishing effort
- AIS vessel presence
- Fishing events
- Encounter events
- Loitering events
- Port visits
- SAR vessel detections
- Offshore fixed infrastructure detections
- Region-based reports and bulk downloads

Common Inputs:

- API token
- Dataset IDs, usually with `:latest`, such as:
  - `public-global-vessel-identity:latest`
  - `public-global-fishing-events:latest`
  - `public-global-fishing-effort:latest`
  - `public-global-presence:latest`
  - `public-global-sar-presence:latest`
  - `public-eez-areas`
- Vessel identifiers:
  - GFW vessel ID
  - IMO
  - MMSI
  - Callsign
  - Vessel name
- Dates:
  - `start-date=YYYY-MM-DD`
  - `end-date=YYYY-MM-DD`
  - `date-range=YYYY-MM-DD,YYYY-MM-DD`
- Pagination:
  - `limit`
  - `offset`
- Report options:
  - `spatial-resolution=LOW|HIGH`
  - `temporal-resolution=DAILY|MONTHLY|YEARLY|ENTIRE`
  - `group-by=FLAG|GEARTYPE|VESSEL_TYPE|VESSEL_ID`
  - `format=JSON|CSV`
- Regions:
  - `region-id`
  - `region-dataset`
  - POST body with a `region` object
- Filters:
  - Example: `filters[0]=vessel_type in ("cargo","carrier")`

Common Outputs:

- JSON responses for search, vessels, events, reports, stats, and metadata
- Report rows often include `date`, `lat`, `lon`, `hours`, `vesselIDs`, and group-by fields such as `flag`, `geartype`, or `vessel_type`
- Event records include `start`, `end`, `id`, `type`, `position`, `regions`, `boundingBox`, distances from shore/port, and vessel summary
- API responses include rate-limit headers

Important Notes:

- If the token is missing or invalid, the API returns an error such as:

```json
{"error":"invalid token"}
```

- GFW states the APIs are intended for non-commercial use.
- Published use should attribute Global Fishing Watch according to their terms.
- Rate limits documented on the site are 50,000 requests per day and 1,500,000 requests per month per user.

Example: Search For A Vessel By IMO

```bash
curl -L -g \
  'https://gateway.api.globalfishingwatch.org/v3/vessels/search?query=7831410&datasets[0]=public-global-vessel-identity:latest' \
  -H "Authorization: Bearer $GFW_TOKEN"
```

Expected output shape:

```json
{
  "limit": 20,
  "total": 1,
  "entries": [
    {
      "dataset": "public-global-vessel-identity:v20231026",
      "registryInfo": [
        {
          "recordId": "IMO-7831410",
          "ssvid": "701000948",
          "flag": "ARG",
          "shipname": "CLAUDINA",
          "callsign": "LW3058",
          "imo": "7831410"
        }
      ]
    }
  ]
}
```

Example: Get Details For One Vessel

```bash
curl -L -g \
  'https://gateway.api.globalfishingwatch.org/v3/vessels/c54923e64-46f3-9338-9dcb-ff09724077a3?dataset=public-global-vessel-identity:latest' \
  -H "Authorization: Bearer $GFW_TOKEN"
```

Example: Get Fishing Events For One Vessel

```bash
curl -L -g \
  'https://gateway.api.globalfishingwatch.org/v3/events?vessels[0]=9b3e9019d-d67f-005a-9593-b66b997559e5&datasets[0]=public-global-fishing-events:latest&start-date=2017-01-01&end-date=2017-01-31&limit=1&offset=0' \
  -H "Authorization: Bearer $GFW_TOKEN"
```

Example: Create A Fishing Effort Report For A Region

```bash
curl -L -g -X POST \
  'https://gateway.api.globalfishingwatch.org/v3/4wings/report?spatial-resolution=LOW&temporal-resolution=MONTHLY&group-by=GEARTYPE&datasets[0]=public-global-fishing-effort:latest&date-range=2022-01-01,2022-05-01&format=JSON' \
  -H "Authorization: Bearer $GFW_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"region":{"dataset":"public-eez-areas","id":5690}}'
```

Example: AIS Vessel Presence Report For Cargo And Carrier Vessels

```bash
curl -L -g \
  'https://gateway.api.globalfishingwatch.org/v3/4wings/report?spatial-resolution=LOW&temporal-resolution=DAILY&group-by=FLAG&datasets[0]=public-global-presence:latest&date-range=2022-01-01,2022-05-01&format=JSON&filters[0]=vessel_type in ("cargo","carrier")&region-id=5690&region-dataset=public-eez-areas' \
  -H "Authorization: Bearer $GFW_TOKEN"
```

## 4. Marine Data Science Data Directory

Source:

- [Marine Data Science: Databases & Data Packages](https://www.marinedatascience.co/data/)

Base URL:

```text
https://www.marinedatascience.co/data/
```

Auth:

- Not applicable.

Best For:

- Discovering marine databases, repositories, and R packages
- Finding sources for oceanographic, climatological, geospatial, taxonomy, fisheries, ecological indicator, genetic, and repository data

Important Note:

- This page is not a REST API. It is a curated directory of marine data sources and software packages.
- To build an app, use it as a discovery/index page, then integrate the specific linked API or data source directly.

Examples Of Linked Data Sources:

- PANGAEA: Earth and environmental science data, often DOI-backed datasets
- ICES Data Centre: North Atlantic data collections, including oceanography, biodiversity, contaminants, fish eggs/larvae, trawl surveys, and more
- Marine Regions: marine geospatial names and boundaries
- WoRMS: marine taxonomy and traits
- OBIS: marine biodiversity occurrence data
- GBIF: biodiversity occurrence data
- FishBase: fish taxonomy, biology, ecology, traits, uses, images, and references
- IUCN Red List API: threatened/endangered species data
- OpenFisheries: fisheries datasets through a Global Fisheries REST API

Practical Use:

```text
Use Marine Data Science to choose a source, then call that source directly.
For example, use WoRMS for taxonomy, OBIS/GBIF for occurrences, Marine Regions for geospatial areas, and Global Fishing Watch for vessel/fishing activity.
```

## Quick Comparison


| Resource             | Auth         | Main Input                                                     | Main Output                                                   | Best Use                                         |
| -------------------- | ------------ | -------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| WoRMS REST           | None         | Scientific name, AphiaID                                       | Taxonomy JSON/XML                                             | Taxon lookup and validation                      |
| MarLIN / MBA         | None         | Species/habitat IDs, AphiaID, NBN key, names, pressure filters | Species, habitats, MarESA sensitivity records, bibliographies | UK/British Isles species and habitat sensitivity |
| Global Fishing Watch | Bearer token | Vessel IDs, datasets, date ranges, regions, filters            | Vessel identity, events, fishing effort, reports              | Vessel/fishing activity and monitoring           |
| Marine Data Science  | None         | None directly                                                  | Directory of links                                            | Finding marine data sources                      |


## Suggested Integration Pattern

1. Use WoRMS to normalize species names and retrieve AphiaIDs.
2. Use MarLIN to enrich species/habitats with sensitivity and evidence data where relevant.
3. Use Global Fishing Watch for human activity layers, vessel search, fishing effort, and events.
4. Use Marine Data Science as a source-discovery page for additional datasets such as OBIS, GBIF, Marine Regions, ICES, PANGAEA, and FishBase.

