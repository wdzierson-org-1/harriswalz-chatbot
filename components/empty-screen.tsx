import { UseChatHelpers } from 'ai/react'
import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to the Harris/Walz AI Chatbot!</h1>
        <p className="leading-normal text-muted-foreground">
          This chatbot is designed to give you information on the Harris/Walz Democratic presidential campaign, 
          including their vision for a New Way Forward, economic policies, healthcare, and more. 
        </p>
        <p className="leading-normal text-muted-foreground">
          Vice President Kamala Harris and Governor Tim Walz are committed to strengthening our democracy, protecting fundamental freedoms, and building an opportunity economy for all Americans. 
          From lowering healthcare costs to cutting taxes for working families, the campaign aims to address critical issues facing the nation.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can ask about their policy positions on middle-class tax cuts, affordable housing, healthcare reforms, or any other campaign-related topic.
          Stay informed and learn more about their plans to tackle key challenges like the opioid crisis, gun violence, and climate change.
        </p>
      </div>
    </div>
  )
}