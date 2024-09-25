import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconGitHub,
  IconSeparator,
  IconVercel
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'

async function UserOrLogin() {
  const session = (await auth()) as Session
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <Link href="/new" rel="nofollow">
          <svg
            width="120"
            height="68"
            viewBox="0 0 86 49"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 mr-2"
          >
            <path
              d="M21.157 22.001h4.014l.763 7.053h5.267L27.262.218h-7.464L15.86 29.054h4.503l.763-7.053h.03Zm2.09-17.6 1.512 13.824h-3.19L23.079 4.4h.169Zm14.594 11.827h1.022c1.282 0 2 .593 2.046 2.824l.137 5.493c.046 1.42.199 2.933.412 4.509h5.13a55.007 55.007 0 0 1-.459-4.603l-.29-5.15c-.168-2.84-.9-4.337-2.976-5.086 2.778-.843 3.572-2.7 3.572-5.586v-.827c0-4.978-2.046-7.584-7.724-7.584h-6.014v28.836h5.128V16.228h.016Zm3.495-8.91v1.81c0 2.606-.687 3.324-2.595 3.324h-.885V4.01h.885c1.908 0 2.595.702 2.595 3.324v-.016ZM9.235 29.054V16.228H5.129v12.826H0V.218h5.129v12.218h4.106V.218h5.129v28.836H9.235Zm61.058 0h-5.129V.218h5.129v28.836ZM86 21.861v.905c0 4.072-2.748 6.787-6.655 6.787-3.908 0-6.9-2.48-6.9-6.88v-3.605h5.083V23c0 1.904.596 2.652 1.664 2.652 1.069 0 1.664-.748 1.664-2.652v-.36c0-1.091-.473-2.168-1.832-3.9l-3.42-4.369c-2.044-2.606-3.052-5.024-3.052-6.928v-.655C72.552 2.715 75.208 0 79.085 0c3.877 0 6.778 2.871 6.778 7.006v2.762h-5.084V6.569c0-1.904-.473-2.652-1.556-2.652-1.084 0-1.557.748-1.557 2.652v.125c0 1.03.427 2.09 1.877 3.979l3.42 4.369c2.106 2.684 3.007 4.9 3.007 6.85l.03-.031Zm-31.933-5.633h1.023c1.282 0 2 .593 2.045 2.824l.137 5.493c.046 1.42.199 2.933.412 4.509h5.13a55.05 55.05 0 0 1-.459-4.603l-.29-5.15c-.168-2.84-.9-4.337-2.976-5.086 2.778-.843 3.572-2.7 3.572-5.586v-.827c0-4.978-2.046-7.584-7.724-7.584h-6.014v28.836h5.128V16.228h.016Zm3.495-8.91v1.81c0 2.606-.687 3.324-2.595 3.324h-.885V4.01h.885c1.908 0 2.595.702 2.595 3.324v-.016ZM37.672 32.893l-4.58 15.884h3.801l.84-3.386h4.564l.84 3.386H47.7l-4.58-15.884h-5.45Zm.824 9.409 1.466-5.93h.091l1.466 5.93H38.48h.015Zm22.882-9.41h11.28v3.2l-6.32 9.361h6.32v3.324h-11.28v-3.199l6.32-9.362h-6.32v-3.323Zm-7.663 12.561h5.816v3.324H49.288V32.893H53.7v12.56h.015ZM33.81 32.893 30.3 48.777h-5.13l-1.908-11.36h-.091l-1.939 11.36h-5.434l-3.51-15.884h4.35l2.106 11.484h.092l2.076-11.484h4.945l2.076 11.484h.092l2.106-11.484h3.694-.015Z"
              fill="currentColor"
            />
          </svg>
        </Link>
      )}
      <div className="flex items-center">
        <IconSeparator className="size-6 text-muted-foreground/50" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          // <Button variant="link" asChild className="-ml-2">
          //   <Link href="/login">Login</Link>
          // </Button>
          <div>
            Harris/Walz Campaign Issues Chatbot
          </div>
        )}
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      {/* <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <IconGitHub />
          <span className="hidden ml-2 md:flex">GitHub</span>
        </a>
        <a
          href="https://vercel.com/templates/Next.js/nextjs-ai-chatbot"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <IconVercel className="mr-2" />
          <span className="hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Deploy</span>
        </a>
      </div> */}
    </header>
  )
}