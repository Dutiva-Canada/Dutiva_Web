import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'

/**
 * The standing crisis line — the verbs are the contact methods: Call opens
 * tel:988, text opens sms:988, 911 opens tel:911. The number itself stays
 * unlinked so both actions share it and the sentence reads intact either
 * way. `more` appends a link to the Resources page's crisis block — only
 * meaningful inside the authenticated portal (the legal walls show the
 * plain version since Resources sits behind the same gate).
 */
export function CrisisNote({ more = false }: { more?: boolean }) {
  const { x } = useI18n()
  return (
    <span className="hb-cn">
      {x(HM.health_cn_q)}{' '}
      <a href="tel:988">{x(HM.health_cn_call)}</a> {x(HM.health_cn_or)}{' '}
      <a href="sms:988">{x(HM.health_cn_text)}</a> {x(HM.health_cn_988)}{' '}
      <a href="tel:911">{x(HM.health_cn_911)}</a> {x(HM.health_cn_end)}
      {more && (
        <>
          {' · '}
          <Link to="/health/resources#crisis">{x(HM.health_cn_more)}</Link>
        </>
      )}
    </span>
  )
}
