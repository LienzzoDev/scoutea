import { ReactNode } from 'react'

import MemberNavbar from './member-navbar'
import { PageContainer } from './page-container'

interface MemberPageLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showNavbar?: boolean
}

export function MemberPageLayout({ 
  children, 
  title, 
  description,
  showNavbar = true 
}: MemberPageLayoutProps) {
  return (
    <>
      {showNavbar && <MemberNavbar />}
      <PageContainer title={title} description={description}>
        {children}
      </PageContainer>
    </>
  )
}