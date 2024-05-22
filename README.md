# COVID Wastewater Summary for RTP, NC

The COVID wastewater data made available by the NC DHHS are not easy to compare and collate across counties and sites, so I decided to make my own summaries:

- ![Durham, Chapel Hill](./figures/Viral%20Particles%20Per%20Person%20Durham,%20Chapel%20Hill%202024-05-22.svg)
- ![Raleigh](./figures/Viral%20Particles%20Per%20Person%20Raleigh%202024-05-22.svg)
- ![Triangle](./figures/Viral%20Particles%20Per%20Person%20Triangle%202024-05-22.svg)

I intend to update this every Wednesday as the NC DHHS makes the wastewater data for the previous week available.

These figures include a linear trend line which, while a poor model of the phenomenon, is a reasonable visual indication of the inexorably upward long-term trend.

I **welcome** issues and pull requests. I am neither a statistician nor an epidemiologist, merely an educated citizen with a strong interest in public health.

## Methodology

We have a csv file from NC DHHS that gives us a row for each site, county, date, the site population, and the viral gene copies per person. I'm interested in aggregating these data across the counties to which I'm broadly exposed.

Not every site provides data on every date; some sites came online later than others, and some sites miss some data collection windows. The site populations as stated are constant over time, another limitation of the underlying data.

The methodology I've chosen is as follows:

- Find all sites in the counties of interest and store their populations served
- Find all observation dates pertaining to those sites
- For each observation date:
  - For each site with data, record the number of viruses in a last observed set
  - For each site for which we have data, whether current or old, multiply the number of viruses per person by the number of people served by the site to arrive at the total number of viruses at the site.
  - Sum the number of viruses over all sites, then divide by the total population served to arrive at the number of viruses per person.

This weights the observations by population size, accounts for sites not coming online simultaneously, and smooths over missing observations by assuming the most recent value continues to be accurate. It does not account for sites going offline in perpetuity or even for an extended period, which is not a feature of the current data set but we may reasonably expect that in the future.

The summarizer will throw an error if site populations change over time, indicating the algorithm needs to account for that. I intend to revise it to throw an error if a site produces no data for some period of time, indicating the naive "last observation is still true" assumption is no longer even possibly reasonable.

It might be better to account for missing data by extrapolating from nearby points, or instead by ignoring the site and its population in the aggregate computation, but since missing data are uncommon, I think it's better to err on the side of simplicity and auditability.

This excludes observations with viral gene copies per person over a threshold, which I think indicate a measurement error and distort the time series graph. I intend to follow up with a more statistically grounded filtering pass. In our corpus, there is one such measurement in Raleigh from 2022-01-14.

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

## References

- [NC DHHS COVID Wastewater Dashboard](https://covid19.ncdhhs.gov/dashboard/wastewater-monitoring) (Note the default dashboard includes a dramatic outlier that has the incidental effect of obscuring the severity of all other waves.)
- [NC DHHS COVID Wastewater Data](https://covid19.ncdhhs.gov/dashboard/data-behind-dashboards)
- [CDC NWSS](https://www.cdc.gov/nwss/rv/COVID19-statetrend.html)

## Similar Projects

- [`@d2718@hachyderm.io` wrote something in R](https://frosty-grass-5181.fly.dev/)
- [`@rossgrady@dood.net` has a Jupyter notebook](https://github.com/rossgrady/covid-wastewater)
