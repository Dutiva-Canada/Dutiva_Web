# DigitalOcean reply — ticket #12739848 (data residency, serverless inference)

**Received:** 2026-08-27  
**From:** Miguel Palma, Cloud Support Engineer | AI/ML  
**Ticket:** [#12739848](https://cloudsupport.digitalocean.com) (ref `!00Df2018t5m.!500QP01hpt1D:ref`)

## Summary (for compliance documentation)

| Question | Answer |
| --- | --- |
| Where does serverless inference run for `deepseek-3.2`? | **Canada, the United States, or the Netherlands** — routed by proximity to the caller and available capacity at request time. |
| Can serverless be pinned to Canada / TOR1? | **No.** There is currently no way to select a datacenter or location for Serverless Inference processing. |
| Likely region for Dutiva (Toronto operator)? | **Most requests likely TOR1**, but not guaranteed. |
| Failover if TOR1 is unavailable? | **Yes — rerouted to the USA or the Netherlands** on serverless. |
| Canada-only processing? | **Dedicated Inference in TOR1** is required; serverless cannot ensure exclusive Canadian processing. |
| Dedicated TOR1 pricing for `deepseek-3.2`? | **Not quoted in ticket** — varies by GPU-hours and configuration; review Control Panel + [Inference Pricing](https://docs.digitalocean.com/products/inference/details/pricing/) / [Availability](https://docs.digitalocean.com/products/inference/details/availability/). Customer Success contact offered on request. |

## Verbatim reply (body)

> Regarding the location where inference processing occurs when using DeepSeek 3.2 on Serverless Inference, it can take place in Canada, the USA, or the Netherlands. This depends mostly on which location is closest to you and on the available capacity at the time of each request.
>
> Please keep in mind that, currently, it is not possible to select a specific data center or location for Serverless Inference processing. Therefore, in order to ensure that your inference processing happens exclusively in Canada, you would need to set up a Dedicated Inference deployment in our Toronto data center (TOR1).
>
> Given your location, it is most likely that the majority of your inference processing is currently happening in our TOR1 data center. However, it is important to understand that, in case of a failover, your processing would be rerouted to either the USA or the Netherlands. As explained above, a Dedicated Inference deployment is the best way to avoid this behavior and ensure that all of your processing remains in Canada.
>
> Finally, regarding your request for pricing of a Dedicated Inference deployment in Canada using DeepSeek 3.2, the cost varies greatly depending on the characteristics you select, as dedicated inference is billed based on the GPU hours used. For this reason, we encourage you to review the options within the DigitalOcean Control Panel, where you can also consult our Inference Pricing and Inference Availability documentation for further details. If you would like more information, please let me know and I will be happy to request that our Customer Success team contact you.

## Dutiva actions

1. **Done (eng):** Revise subprocessors EN/FR — remove "Toronto, Canada" for Gradient serverless; disclose CA / US / NL routing.
2. **Owner decision:** Stay on serverless (with accurate disclosure) **or** provision Dedicated Inference TOR1 for `deepseek-3.2` and update routing secrets.
3. **Optional:** Request Customer Success call for Dedicated TOR1 sizing and quote.

See [do-residency-confirmation-request.md](do-residency-confirmation-request.md), [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md), CANONICAL_FACTS § "Claims to stop making" #2.
