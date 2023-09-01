# COVID Wastewater Summary for Orange and Durham counties, NC

The COVID wastewater data made available by the NC DHHS are not easy to compare and collate across counties and sites, so I decided to make my own summary. The picture is not a good one:

![COVID Wastewater Data](./COVID%20in%20Orange%20and%20Durham%20county%20wastewater.png)

I am not yet confident in my summarizer, the peak for the 2022-2023 winter is higher than I would have expected, but the overall shape of the data seems correct. I **welcome** critiques and pull requests.

## Methodology

We have a csv file from NC DHHS that gives us a row for each site, county, date, the site population, and the viral gene copies per person. I'm interested in aggregating these data across the counties to which I'm broadly exposed, namely Orange and Durham counties.

Not every site provides data on every date; some sites came online later than others, and some sites miss some data collection windows. The site populations are stated are constant, another limitation of the underlying data.

The methodology I've chosen is as follows:

- Find all sites in the counties of interest and store their populations served
- Find all observation dates pertaining to those sites
- For each observation date:
  - For each site with data, record the number of viruses in a last observed set
  - For each site for which we have data, whether current or old, multiply the number of viruses per person by the number of people served by the site to arrive at the total number of viruses at the site.
  - Sum the number of viruses over all sites, then divide by the total population served to arrive at the number of viruses per person.

This weights the observations by population size, accounts for sites not coming online simultaneously, and smooths over missing observations by assuming the most recent value continues to be accurate. It does not account for sites going offline in perpetuity or even for an extended period, which is not a feature of the current data set but we may reasonably expect that in the future.

## Conclusion

If these data and my summary are correct, and if COVID case counts correlate
with wastewater in aggregate, as has seemed to be case, then in the fall of
2023, we're seeing a exponential rise comparable to Omicron. You are strongly
advised to wear masks when sharing air with people outside your immediate
family, to push for a reintroduction of mask mandates especially in places where
especially vulnerable populations must go (hospitals, schools, pharmacies), and
to push for better indoor filtration systems. The risk of death has receded for
many but the risk of severe adverse consequences, including being disabled by
PASC or Long COVID, should not be understated.
