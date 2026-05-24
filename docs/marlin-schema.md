Marlin API provides:


Basic Data:
./marlin/species
Lists all published species
Returns:

speciesID
taxonomyName
synonymCommonName
taxonomyAuthority
aphiaID
NBMVersionKey
speciesReviewDate
url
https://api.mba.ac.uk/marlin/species


./marlin/species/[n]
Lists an individual published species, where [n] is the speciesID
Returns:

speciesID
taxonomyName
synonymCommonName
taxonomyAuthority
aphiaID
NBMVersionKey
speciesReviewDate
url
https://api.mba.ac.uk/marlin/species/1722


Using a "type=species|aphia|nbm|name" GET parameter it is possible specify the ID type for [n].

https://api.mba.ac.uk/marlin/species/1722?type=species
https://api.mba.ac.uk/marlin/species/141433?type=aphia
https://api.mba.ac.uk/marlin/species/NHMSYS0021054811?type=nbm
https://api.mba.ac.uk/marlin/species/abra alba?type=name

When using the "name" type, it is also possible to add a "like=true" GET parameter to return records that include the name.

Remember to include the space in the species names if you're looking for an exact match.

https://api.mba.ac.uk/marlin/species/abra?type=name&like=true



./marlin/speciespressures
Lists all published MarESA species pressures
Returns:

speciesID
Name
NECode
Pressure
Resistance
ResistanceQoE
ResistanceAoE
ResistanceDoE
Resilience
ResilienceQoE
ResilienceAoE
resilienceDoE
Sensitivity
SensitivityQoE
SensitivityAoE
SensitivityDoE
speciesReviewDate
url
https://api.mba.ac.uk/marlin/speciespressures


./marlin/speciespressures/[n]
Lists individual published MarESA species pressures, where [n] is the speciesID
Returns:

speciesID
Name
NECode
Pressure
Resistance
ResistanceQoE
ResistanceAoE
ResistanceDoE
Resilience
ResilienceQoE
ResilienceAoE
resilienceDoE
Sensitivity
SensitivityQoE
SensitivityAoE
SensitivityDoE
speciesReviewDate
url
https://api.mba.ac.uk/marlin/speciespressures/1519


Using a "type=species|aphia|nbm|name" GET parameter it is possible specify the ID type for [n].

https://api.mba.ac.uk/marlin/speciespressures/1519?type=species
https://api.mba.ac.uk/marlin/speciespressures/138802?type=aphia
https://api.mba.ac.uk/marlin/speciespressures/NBNSYS0000173928?type=nbm
https://api.mba.ac.uk/marlin/speciespressures/arctica islandica?type=name

When using the "name" type, it is also possible to add a "like=true" GET parameter to return records that include the name

https://api.mba.ac.uk/marlin/speciespressures/arctica?type=name&like=true


Evidence
Additionally, the evidence data can also be returned using the "withevidence=true" GET parameter.

https://api.mba.ac.uk/marlin/speciespressures?withevidence=true
(for all records)

https://api.mba.ac.uk/marlin/speciespressures/1519?withevidence=true
where [n] is the speciesID


Pressure Themes
The default is to include all themes (Biological, Physical, Hydrological, Chemical, Climate Change) in the results.

Any combination of themes may be excluded using the "[withbio|withphys|withhydro|withchem|withcc]=false" GET parameter

./marlin/speciespressures?withbio=false&withphys=false



./marlin/speciesbibliographies
Lists bibliographies for all published species
Returns:

speciesID
taxonomyName
synonymCommonName
taxonomyAuthority
aphiaID
NBMVersionKey
speciesReviewDate
referenceShort
referenceFull
https://api.mba.ac.uk/marlin/speciesbibliographies


./marlin/speciesbibliographies/[n]
Lists the bibliography for individual published species, where [n] is the speciesID
Returns:

speciesID
taxonomyName
synonymCommonName
taxonomyAuthority
aphiaID
NBMVersionKey
speciesReviewDate
referenceShort
referenceFull
https://api.mba.ac.uk/marlin/speciesbibliographies/12


Using a "type=species|aphia|nbm|name" GET parameter it is possible specify the ID type for [n].

https://api.mba.ac.uk/marlin/speciesbibliographies/1722?type=species
https://api.mba.ac.uk/marlin/speciesbibliographies/141433?type=aphia
https://api.mba.ac.uk/marlin/speciesbibliographies/NHMSYS0021054811?type=nbm
https://api.mba.ac.uk/marlin/speciesbibliographies/abra alba?type=name

When using the "name" type, it is also possible to add a "like=true" GET parameter to return records that include the name

https://api.mba.ac.uk/marlin/speciesbibliographies/abra?type=name&like=true



./marlin/habitats
Lists all published habitats
Returns:

habitatID
habitatInformationName
habitatClassificationJNCC2015Code
habitatClassificationJNCC2015Name
habitatClassificationJNCC2022Code
habitatClassificationJNCC2022Name
habitatClassificationEUNIS2008Code
habitatClassificationEUNIS2008Name
habitatClassificationEUNIS2022Code
habitatClassificationEUNIS2022Name
habitatInformationReviewDate
url
https://api.mba.ac.uk/marlin/habitats


./marlin/habitats/[n]
Lists an individual published habitat, where [n] is the habitatID
Returns:

habitatID
habitatInformationName
habitatClassificationJNCC2015Code
habitatClassificationJNCC2015Name
habitatClassificationJNCC2022Code
habitatClassificationJNCC2022Name
habitatClassificationEUNIS2008Code
habitatClassificationEUNIS2008Name
habitatClassificationEUNIS2022Code
habitatClassificationEUNIS2022Name
habitatInformationReviewDate
url
https://api.mba.ac.uk/marlin/habitats/2


Using a "type=habitat|jncc|eunis" GET parameter it is possible specify the ID type for [n].

https://api.mba.ac.uk/marlin/habitats/12?type=habitat
https://api.mba.ac.uk/marlin/habitats/LR.MLR.BF.Rho?type=jncc
https://api.mba.ac.uk/marlin/habitats/MA1245?type=eunis


./marlin/habitatspressures
Lists all published MarESA habitats pressures
Returns:

habitatID
JNCC_2015_Code
JNCC_2015_Name
JNCC2022_Code
JNCC2022_Name
EUNIS_2008_Code
EUNIS_2008_Name
EUNIS_2022_Code
EUNIS_2022_Name
NECode
Pressure
Resistance
ResistanceQoE
ResistanceAoE
ResistanceDoE
Resilience
ResilienceQoE
ResilienceAoE
resilienceDoE
Sensitivity
SensitivityQoE
SensitivityAoE
SensitivityDoE
Confidence
habitatInformationReviewDate
url
https://api.mba.ac.uk/marlin/habitatspressures


./marlin/habitatspressures/[n]
Lists individual published MarESA habitat pressures, where [n] is the habitatID
Returns:

habitatID
JNCC_2015_Code
JNCC_2015_Name
JNCC_2022_Code
JNCC_2022_Name
EUNIS_2008_Code
EUNIS_2008_Name
EUNIS_2022_Code
EUNIS_2022_Name
NECode
Pressure
Resistance
ResistanceQoE
ResistanceAoE
ResistanceDoE
Resilience
ResilienceQoE
ResilienceAoE
resilienceDoE
Sensitivity
SensitivityQoE
SensitivityAoE
SensitivityDoE
Confidence
habitatInformationReviewDate
url
https://api.mba.ac.uk/marlin/habitatspressures/2



Using a "type=habitat|jncc|eunis" GET parameter it is possible specify the ID type for [n].

https://api.mba.ac.uk/marlin/habitatspressures/12?type=habitat
https://api.mba.ac.uk/marlin/habitatspressures/LR.MLR.BF.Rho?type=jncc
https://api.mba.ac.uk/marlin/habitatspressures/MA1245?type=eunis


Evidence
Additionally, the evidence data can also be returned using the "withevidence=true" GET parameter.

https://api.mba.ac.uk/marlin/habitatspressures?withevidence=true
(for all records)

https://api.mba.ac.uk/marlin/habitatspressures/2?withevidence=true
where [n] is the speciesID


Pressure Themes
The default is to include all themes (Biological, Physical, Hydrological, Chemical, Climate Change) in the results.

Any combination of themes may be excluded using the "withbio|withphys|withhydro|withchem|withcc=false" GET parameter

./marlin/habitatspressures?withbio=false&withphys=false


./marlin/habitatsbibliographies
Lists bibliographies for all published habitats
Returns:

habitatID
habitatClassificationJNCC2015Code
habitatClassificationJNCC2015Name
habitatClassificationJNCC2022Code
habitatClassificationJNCC2022Name
habitatClassificationEUNIS2008Code
habitatClassificationEUNIS2008Name
habitatClassificationEUNIS2022Code
habitatClassificationEUNIS2022Name
habitatInformationReviewDate
referenceShort
referenceFull
https://api.mba.ac.uk/marlin/habitatsbibliographies



./marlin/habitatsbibliographies/[n]
Lists the bibliography for individual published habitats, where [n] is the habitatID
Returns:

habitatID
habitatClassificationJNCC2015Code
habitatClassificationJNCC2015Name
habitatClassificationJNCC2022Code
habitatClassificationJNCC2022Name
habitatClassificationEUNIS2008Code
habitatClassificationEUNIS2008Name
habitatClassificationEUNIS2022Code
habitatClassificationEUNIS2022Name
habitatInformationReviewDate
referenceShort
referenceFull
https://api.mba.ac.uk/marlin/habitatsbibliographies/2



Using a "type=habitat|jncc|eunis" GET parameter it is possible specify the ID type for [n].

https://api.mba.ac.uk/marlin/habitatsbibliographies/12?type=habitat
https://api.mba.ac.uk/marlin/habitatsbibliographies/LR.MLR.BF.Rho?type=jncc
https://api.mba.ac.uk/marlin/habitatsbibliographies/MA1245?type=eunis