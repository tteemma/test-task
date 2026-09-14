import styled from 'styled-components';

const State = styled.section`max-width: 560px; margin: 72px auto; border-radius: 12px; background: #fff; padding: 28px; text-align: center; box-shadow: 0 6px 24px rgb(15 23 42 / 9%);`;
const Retry = styled.button`border: 0; border-radius: 7px; background: #2563eb; color: #fff; cursor: pointer; margin-top: 12px; padding: 9px 14px;`;
export function StatusState({ title, detail, retry }: { title: string; detail?: string; retry?: () => void }) { return <State role={retry ? 'alert' : 'status'}><h2>{title}</h2>{detail && <p>{detail}</p>}{retry && <Retry type="button" onClick={retry}>Повторить</Retry>}</State>; }
