import { CrmWorkspace } from './CrmWorkspace'

/** Demo-mode CRM workspace — loads Northgate-style fixtures. */
export function CrmDemoView() {
  return <CrmWorkspace mode="demo" organizationId={undefined} />
}
