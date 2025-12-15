import Dashboard from '@/components/Dashboard'

type PageProps = {
  searchParams?: { clientId?: string }
}

export default function Page(props: PageProps) {
  return <Dashboard clientId={props.searchParams?.clientId} />
}
