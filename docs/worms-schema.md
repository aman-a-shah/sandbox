Ajax calls


GET
/AjaxAphiaRecordsByNamePart/{NamePart}
Get taxa suggestion for a given prefix of a taxon name.
Attributes


GET
/AphiaAttributeKeysByID/{ID}
Get attribute definitions

GET
/AphiaAttributesByAphiaID/{ID}
Get a list of attributes for a given AphiaID

GET
/AphiaAttributeValuesByCategoryID/{ID}
Get list values that are grouped by an CateogryID

GET
/AphiaIDsByAttributeKeyID/{ID}
Get a list of AphiaID's (max 50) with attribute tree for a given attribute definition ID
Distributions


GET
/AphiaDistributionsByAphiaID/{ID}
Get all distributions for a given AphiaID
External Identifiers


GET
/AphiaExternalIDByAphiaID/{ID}
Get any external identifier(s) for a given AphiaID

GET
/AphiaRecordByExternalID/{ID}
Get the Aphia Record for a given external identifier
Sources


GET
/AphiaSourcesByAphiaID/{ID}
Get one or more sources/references including links, for one AphiaID
Taxonomic data


GET
/AphiaChildrenByAphiaID/{ID}
Get the direct children (max. 50) for a given AphiaID

GET
/AphiaClassificationByAphiaID/{ID}
Get the complete classification for one taxon. This also includes any sub or super ranks.

GET
/AphiaIDByName/{ScientificName}
Get the AphiaID for a given name.

GET
/AphiaNameByAphiaID/{ID}
Get the name for a given AphiaID

GET
/AphiaRecordByAphiaID/{ID}
Get the complete AphiaRecord for a given AphiaID

GET
/AphiaRecordFullByAphiaID/{ID}
Get the complete AphiaFullRecord for a given AphiaID

GET
/AphiaRecordsByAphiaIDs
Get an AphiaRecord for multiple AphiaIDs in one go (max: 50)

GET
/AphiaRecordsByDate
Lists all AphiaRecords (taxa) that have their last edit action (modified or added) during the specified period

GET
/AphiaRecordsByMatchNames
Try to find AphiaRecords using the TAXAMATCH fuzzy matching algorithm by Tony Rees

GET
/AphiaRecordsByName/{ScientificName}
Get one or more matching (max. 50) AphiaRecords for a given name

GET
/AphiaRecordsByNames
For each given scientific name, try to find one or more AphiaRecords

GET
/AphiaRecordsByTaxonRankID/{ID}
Get the AphiaRecords for a given taxonRankID (max 50)

GET
/AphiaSynonymsByAphiaID/{ID}
Get all synonyms for a given AphiaID

GET
/AphiaTaxonRanksByID/{ID}
Get taxonomic ranks by their identifier

GET
/AphiaTaxonRanksByName/{taxonRank}
Get taxonomic ranks by their name
Vernaculars


GET
/AphiaRecordsByVernacular/{Vernacular}
Get one or more Aphia Records (max. 50) for a given vernacular

GET
/AphiaVernacularsByAphiaID/{ID}
Get all vernaculars for a given AphiaID

Schemas
AphiaRecord{
AphiaID	integer
default: 127160
Unique and persistent identifier within WoRMS. Primary key in the database --

url	string
HTTP URL to the AphiaRecord

scientificname	string
The full scientific name without authorship

authority	string
The authorship information for the scientificname formatted according to the conventions of the applicable nomenclaturalCode

taxonRankID	integer
The taxonomic rank identifier of the most specific name in the scientificname

rank	string
The taxonomic rank of the most specific name in the scientificname

status	string
The status of the use of the scientificname (usually a taxonomic opinion). Additional technical statuses are (1) quarantined: hidden from public interface after decision from an editor and (2) deleted: AphiaID should NOT be used anymore, please replace it by the valid_AphiaID

unacceptreason	string
The reason why a scientificname is unaccepted

valid_AphiaID	boolean
The AphiaID (for the scientificname) of the currently accepted taxon. NULL if there is no currently accepted taxon.

valid_name	string
The scientificname of the currently accepted taxon

valid_authority	string
The authorship information for the scientificname of the currently accepted taxon

parentNameUsageID	integer
The AphiaID (for the scientificname) of the direct, most proximate higher-rank parent taxon (in a classification)

originalNameUsageID	integer
The AphiaID (for the scientificname) of the original name

kingdom	string
The full scientific name of the kingdom in which the taxon is classified

phylum	string
The full scientific name of the phylum or division in which the taxon is classified

class	string
The full scientific name of the class in which the taxon is classified

order	string
The full scientific name of the order in which the taxon is classified

family	string
The full scientific name of the family in which the taxon is classified

genus	string
The full scientific name of the genus in which the taxon is classified

citation	string
A bibliographic reference for the resource as a statement indicating how this record should be cited (attributed) when used

lsid	string
LifeScience Identifier. Persistent GUID for an AphiaID

isMarine	boolean
A boolean flag indicating whether the taxon is a marine organism, i.e. can be found in/above sea water. Possible values: 0/1/NULL

isBrackish	boolean
A boolean flag indicating whether the taxon occurs in brackish habitats. Possible values: 0/1/NULL

isFreshwater	boolean
A boolean flag indicating whether the taxon occurs in freshwater habitats, i.e. can be found in/above rivers or lakes. Possible values: 0/1/NULL

isTerrestrial	boolean
A boolean flag indicating the taxon is a terrestrial organism, i.e. occurs on land as opposed to the sea. Possible values: 0/1/NULL

isExtinct	boolean
A flag indicating an extinct organism. Possible values: 0/1/NULL

match_type	string
Type of match. Possible values: exact/exact_subgenus/exact_replaced/like/phonetic/near_1/near_2/near_3/match_quarantine/match_deleted. See here (bottom) for a full explanation of the types of matches.

modified	string
The most recent date-time in GMT on which the resource was changed

}
AphiaRecords[
title: AphiaRecords
AphiaRecords{
AphiaID	integer
default: 127160
Unique and persistent identifier within WoRMS. Primary key in the database --

url	string
HTTP URL to the AphiaRecord

scientificname	string
The full scientific name without authorship

authority	string
The authorship information for the scientificname formatted according to the conventions of the applicable nomenclaturalCode

taxonRankID	integer
The taxonomic rank identifier of the most specific name in the scientificname

rank	string
The taxonomic rank of the most specific name in the scientificname

status	string
The status of the use of the scientificname (usually a taxonomic opinion). Additional technical statuses are (1) quarantined: hidden from public interface after decision from an editor and (2) deleted: AphiaID should NOT be used anymore, please replace it by the valid_AphiaID

unacceptreason	string
The reason why a scientificname is unaccepted

valid_AphiaID	boolean
The AphiaID (for the scientificname) of the currently accepted taxon. NULL if there is no currently accepted taxon.

valid_name	string
The scientificname of the currently accepted taxon

valid_authority	string
The authorship information for the scientificname of the currently accepted taxon

parentNameUsageID	integer
The AphiaID (for the scientificname) of the direct, most proximate higher-rank parent taxon (in a classification)

originalNameUsageID	integer
The AphiaID (for the scientificname) of the original name

kingdom	string
The full scientific name of the kingdom in which the taxon is classified

phylum	string
The full scientific name of the phylum or division in which the taxon is classified

class	string
The full scientific name of the class in which the taxon is classified

order	string
The full scientific name of the order in which the taxon is classified

family	string
The full scientific name of the family in which the taxon is classified

genus	string
The full scientific name of the genus in which the taxon is classified

citation	string
A bibliographic reference for the resource as a statement indicating how this record should be cited (attributed) when used

lsid	string
LifeScience Identifier. Persistent GUID for an AphiaID

isMarine	boolean
A boolean flag indicating whether the taxon is a marine organism, i.e. can be found in/above sea water. Possible values: 0/1/NULL

isBrackish	boolean
A boolean flag indicating whether the taxon occurs in brackish habitats. Possible values: 0/1/NULL

isFreshwater	boolean
A boolean flag indicating whether the taxon occurs in freshwater habitats, i.e. can be found in/above rivers or lakes. Possible values: 0/1/NULL

isTerrestrial	boolean
A boolean flag indicating the taxon is a terrestrial organism, i.e. occurs on land as opposed to the sea. Possible values: 0/1/NULL

isExtinct	boolean
A flag indicating an extinct organism. Possible values: 0/1/NULL

match_type	string
Type of match. Possible values: exact/exact_subgenus/exact_replaced/like/phonetic/near_1/near_2/near_3/match_quarantine/match_deleted. See here (bottom) for a full explanation of the types of matches.

modified	string
The most recent date-time in GMT on which the resource was changed

}]
Classification{
AphiaID	integer
default: 126132
rank	string
scientificname	string
child	{
}
nullable: true
}
Distribution{
locality	string
The specific description of the place

locationID	string
An identifier for the locality. Using the Marine Regions Geographic IDentifier (MRGID), see https://www.marineregions.org/mrgid.php

higherGeography	string
A geographic name less specific than the information captured in the locality term. Possible values: an IHO Sea Area or Nation, derived from the MarineRegions gazetteer

higherGeographyID	string
An identifier for the geographic region within which the locality occurred, using MRGID

recordStatus	string
The status of the distribution record. Possible values are 'valid' ,'doubtful' or 'inaccurate'. See here for explanation of the statuses

typeStatus	string
The type status of the distribution. Possible values: 'holotype' or empty.

establishmentMeans	string
nullable: true
The process by which the biological individual(s) represented in the Occurrence became established at the location. Possible values: values listed as Origin in WRiMS

invasiveness	string
nullable: true
The invasiveness of the species. Possible values: values listed as Invasiveness in WRiMS

occurrence	string
nullable: true
The occurence status. Possible values: values listed as Occurrence in WRiMS

decimalLatitude	number
The geographic latitude (in decimal degrees, WGS84)

decimalLongitude	number
The geographic longitude (in decimal degrees, WGS84)

qualityStatus	string
Quality status of the record. Possible values: 'checked', 'trusted' or 'unreviewed'. See here

}
Vernacular{
vernacular	string
language_code	string
language	string
}
Source{
source_id	integer
default: 1
Unique identifier for the source within WoRMS

use	string
Usage of the source for this taxon. See here for all values

reference	string
Full citation string

page	string
Page(s) where the taxon is mentioned

url	string
Direct link to the source record

link	string
External link (i.e. journal, data system, etc..)

fulltext	string
Full text link (PDF)

doi	string
Digital Object Identifier

}
AphiaRank{
taxonRankID	integer
example: 220
A taxonomic rank identifier

taxonRank	string
example: species
A taxonomic rank name

AphiaID	integer
example: 2
The AphiaID of the kingdom

kingdom	string
example: Animalia
The name of a taxonomic kingdom the rank is used in

}
AttributeKey{
measurementTypeID	integer
example: 4
An internal identifier for the measurementType

measurementType	string
example: Functional group
The nature of the measurement, fact, characteristic, or assertion https://www.marinespecies.org/traits/wiki

input_id	integer
example: 1
The data type that is expected as value for this attribute definition

CategoryID	integer
example: 7
The category identifier to list possible attribute values for this attribute definition

children	[
xml: OrderedMap { "name": "children", "wrapped": true }
The possible child attribute keys that help to describe to current attribute

{...}]
}
AttributeKeyWithValues{
measurementTypeID	integer
example: 4
An internal identifier for the measurementType

measurementType	string
example: Functional group
The nature of the measurement, fact, characteristic, or assertion https://www.marinespecies.org/traits/wiki

possibleAttributeValues	[
xml: OrderedMap { "name": "possibleAttributeValues", "wrapped": true }
The category definition that list possible attribute values for this attribute definition

AttributeValue{
measurementValueID	integer
example: 185
An identifier for facts stored in the column measurementValue

measurementValue	string
example: macrobenthos
The value of the measurement, fact, characteristic, or assertion

measurementValueCode	string
example:
Additional info/code that helps to the describe/define the measurementValue

children	[
xml: OrderedMap { "name": "children", "wrapped": true }
Child measurementValues that are more specific

{...}]
}]
children	[
xml: OrderedMap { "name": "children", "wrapped": true }
The possible child attribute keys that help to describe to current attribute

{...}]
}
AttributeValue{
measurementValueID	integer
example: 185
An identifier for facts stored in the column measurementValue

measurementValue	string
example: macrobenthos
The value of the measurement, fact, characteristic, or assertion

measurementValueCode	string
example:
Additional info/code that helps to the describe/define the measurementValue

children	[
xml: OrderedMap { "name": "children", "wrapped": true }
Child measurementValues that are more specific

{...}]
}
Attribute{
AphiaID	integer
example: 127160
Unique and persistent identifier within WoRMS

measurementTypeID	integer
example: 15
The corresponding AttributeKey its measurementTypeID

measurementType	string
example: Body size
The corresponding AttributeKey its measurementType

measurementValue	string
example: 70
The value of the measurement, fact, characteristic, or assertion

source_id	integer
example: 232308
The identifier for the AphiaSource for this attribute

reference	string
example:
The AphiaSource reference for this attribute

qualitystatus	string
example: checked
Quality status of the record. Possible values: 'checked', 'trusted' or 'unreviewed'. See here

CategoryID	integer
example:
The category identifier to list possible attribute values for this attribute definition

AphiaID_Inherited	integer
example: 126132
The AphiaID from where this attribute is inherited

children	[
xml: OrderedMap { "name": "children", "wrapped": true }
The possible child attributes that help to describe to current attribute

{...}]
}
AphiaAttributeSet{
AphiaID	integer
example: 127160
Unique and persistent identifier within WoRMS. Primary key in the database

Attributes	[
xml: OrderedMap { "name": "Attributes", "wrapped": true }
Attribute{...}]
}
BadRequestError{
code	integer
example: 400
success	boolean
example: false
errors	[
xml: OrderedMap { "name": "errors", "wrapped": true }
{...}]
}