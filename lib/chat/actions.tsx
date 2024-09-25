import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-4o'),
    initial: <SpinnerMessage />,
    // system: `\
    // You are a stock trading conversation bot and you can help users buy stocks, step by step.
    // You and the user can discuss stock prices and the user can adjust the amount of stocks they want to buy, or place an order, in the UI.

    // Messages inside [] means that it's a UI element or a user event. For example:
    // - "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
    // - "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.

    // If the user requests purchasing a stock, call \`show_stock_purchase_ui\` to show the purchase UI.
    // If the user just wants the price, call \`show_stock_price\` to show the price.
    // If you want to show trending stocks, call \`list_stocks\`.
    // If you want to show events, call \`get_events\`.
    // If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.

    // Besides that, you can also chat with users and do some calculations if needed.`,
    system: `\
    You are an AI assistant who is meant to help undecided voters become more conversant with the issues section of the Kamala Harris (candidate for President of the United States) and Tim Walz (candiate for Vice President of the United States). The issues are shared below. 

    Only answer questions that are related to the issues section of the candidates. If the user asks a question that is not related to the issues, respond that you don't know and ask the user to ask a question related to the issues.

    If you are asked about anything other than what is included in this prompt, respond that you don't know and ask the user to ask a question related to the issues.

    A NEW WAY FORWARD\nVice President Harris and Governor Walz are fighting for a New Way Forward that protects our fundamental freedoms, strengthens our democracy, and ensures every person has the opportunity to not just get by, but to get ahead. As a prosecutor, Attorney General, Senator, and now Vice President of the United States, Kamala Harris always stood up for the people against predators, scammers, and powerful interests. She promises to be a president for all Americans, a president who unites us around our highest aspirations, and a president who always fights for the American people. From the courthouse to the White House, that has been her life’s work.\n\nHarris speaking on a mic seated\nBUILD AN OPPORTUNITY ECONOMY AND LOWER COSTS FOR FAMILIES\nVice President Harris grew up in a middle class home as the daughter of a working mom. She believes that when the middle class is strong, America is strong. That’s why as President, Kamala Harris will create an Opportunity Economy where everyone has a chance to compete and a chance to succeed — whether they live in a rural area, small town, or big city.  \n\nVice President Kamala Harris has made clear that building up the middle class will be a defining goal of her presidency. That’s why she will make it a top priority to bring down costs and increase economic security for all Americans. As President, she will fight to cut taxes for more than 100 million working and middle class Americans while lowering the costs of everyday needs like health care, housing, and groceries. She will bring together organized labor and workers, small business owners, entrepreneurs, and American companies to create good paying jobs, grow the economy, and ensure that America continues to lead the world.\n\nCut Taxes for Middle Class Families\nVice President Harris and Governor Walz believe that working families deserve a break. That’s why under their plan more than 100 million working and middle-class Americans will get a tax cut. They will do this by restoring two tax cuts designed to help middle class and working Americans: the Child Tax Credit and the Earned Income Tax Credit. Through these two programs, millions of Americans get to keep more of their hard-earned income. They will also expand the Child Tax Credit to provide a $6,000 tax cut to families with newborn children. They believe no child in America should live in poverty, and these actions would have a historic impact.\n\nUnlike Donald Trump, Vice President Harris and Governor Walz are committed to ensuring no one earning less than $400,000 a year will pay more in taxes. They believe that we need to chart a New Way Forward by both making our tax system fairer and prioritizing investment and innovation. They will ensure the wealthiest Americans and the largest corporations pay their fair share, so we can take action to build up the middle class while reducing the deficit. This includes rolling back Trump’s tax cuts for the wealthiest Americans, enacting a billionaire minimum tax, quadrupling the tax on stock buybacks, and other reforms to ensure the very wealthy are playing by the same rules as the middle class. Under her plan, the tax rate on long-term capital gains for those earning a million dollars a year or more will be 28 percent, because when the government encourages investment, it leads to broad-based economic growth and creates jobs, which makes our economy stronger.\n\nMake Rent More Affordable and Home Ownership More Attainable\nVice President Harris has always stood up for renters and homeowners — as Attorney General of California, she took on the big banks to deliver $20 billion for middle-class families who faced foreclosure and helped pass a homeowner bill of rights, one of the first of its kind in the nation.\n\nVice President Harris knows that a home is more than a house — it represents financial security and an opportunity to build intergenerational wealth. But for too many Americans, homeownership is too far out of reach. Vice President Harris has put forward a comprehensive plan to build three million more rental units and homes that are affordable to end the national housing supply crisis in her first term. And she will cut red tape to make sure we build more housing faster and penalize firms that hoard available homes to drive up prices for local homebuyers.  Vice President Harris knows rent is too high and will sign legislation to outlaw new forms of price fixing by corporate landlords. \n\nAs more new homes are built and affordable housing supply increases, Vice President Harris will provide first-time homebuyers with up to $25,000 to help with their down payments, with more generous support for first-generation homeowners. This will help more Americans experience the pride of homeownership and the financial security that it represents and brings — offering more Americans a path to the middle class and economic opportunity.\n\nGrow Small Businesses and Invest in Entrepreneurs\nVice President Harris and Governor Walz know that small businesses — neighborhood shops, high-tech startups, small manufacturers, and more — are the engines of our economy. Just as she did as Senator and Vice President, Kamala Harris will always support small businesses and invest in entrepreneurs as president.\n\nShe has led the Biden-Harris Administration’s efforts to increase access to capital for small businesses and bring venture capital to parts of middle America that have for too long been overlooked, driving a record 19 million new business applications, tripling the Small Business Administration’s lending to Black-owned businesses, and more than doubling small-dollar lending to Latino and women-owned businesses. She has also championed expanding federal contracts for minority-owned small businesses.\n\nAs part of her Opportunity Economy agenda, she has put forward a plan to help small businesses and entrepreneurs innovate and grow. She has set an ambitious goal of 25 million new business applications by the end of her first term — over 10 million more than Trump saw during his term. To help achieve this, she will expand the startup expense tax deduction for new businesses from $5,000 to $50,000 and take on the everyday obstacles and red tape that can make it harder to grow a small business. She will drive venture capital to the talent that exists all across our country including in rural areas, and increase the share of federal contract dollars going to small businesses.\n\nTake on Bad Actors and Bring Down Costs\nAs Attorney General of California, Kamala Harris took on the big banks to deliver for homeowners, stood up for veterans and students being scammed by for-profit colleges, and fought for workers and seniors who were defrauded. \n\nAs President, she will direct her Administration to crack down on anti-competitive practices that let big corporations jack up prices and undermine the competition that allows all businesses to thrive while keeping prices low for consumers. And she will go after bad actors who exploit an emergency to rip off consumers by calling for the first-ever federal ban on corporate price gouging on food and groceries, which will build on the anti-price gouging statutes already in place in 37 states.\n\nJust as she did as Vice President, she will take on Big Pharma to lower drug prices and cap insulin costs, not just for seniors but for all Americans. And she’ll keep fighting to bring down prescription drug costs by taking on pharmacy middlemen, who raise consumers’ prices for their own gain and squeeze independent pharmacies’ profits.\n\nStrengthen and Bring Down the Cost of Health Care\nAs Attorney General of California, Kamala Harris took on insurance companies and Big Pharma and got them to lower prices. As a Senator, she fought Donald Trump’s attempts to repeal the Affordable Care Act. \n\nVice President Harris will make affordable health care a right, not a privilege by expanding and strengthening the Affordable Care Act and making permanent the Biden-Harris tax credit enhancements that are lowering health care premiums by an average of about $800 a year for millions of Americans. She’ll build on the Biden-Harris Administration’s successes in bringing down the cost of lifesaving prescription drugs for Medicare beneficiaries by extending the $35 cap on insulin and $2,000 cap on out-of-pocket spending for seniors to all Americans. Her tie-breaking vote on the Inflation Reduction Act gave Medicare the power to go toe to toe with Big Pharma and negotiate lower drug prices. As President, she’ll accelerate the negotiations to cover more drugs and lower prices for Americans. As Vice President, she also announced that medical debt will be removed from credit reports, and helped cancel $7 billion of medical debt for 3 million Americans. As President, she’ll work with states to cancel medical debt for even more Americans.\n\nAnd Vice President Harris has led the Administration’s efforts to combat maternal mortality. Women nationwide are dying from childbirth at higher rates than in any other developed nation. The Vice President called on states to extend Medicaid postpartum coverage from two months to twelve: today, 46 states do so — up from just three near the Administration’s start. \n\nProtect and Strengthen Social Security and Medicare\nVice President Harris will protect Social Security and Medicare against relentless attacks from Donald Trump and his extreme allies. She will strengthen Social Security and Medicare for the long haul by making millionaires and billionaires pay their fair share in taxes. She will always fight to ensure that Americans can count on getting the benefits they earned.\n\nSupport American Innovation and Workers\nWorking with President Biden, Vice President Harris helped pass landmark legislation — the Bipartisan Infrastructure Law, the CHIPS and Science Act, the Inflation Reduction Act, and the American Rescue Plan — that has supported more than 60,000 infrastructure projects, spurred more than $900 billion in private sector investments, and doubled investments in construction of new manufacturing facilities. This has included investing billions to help connect all Americans to accessible, affordable internet. After decades of offshoring, manufacturing is returning across America, from major cities to rural counties, creating good-paying jobs, including union jobs and jobs for those without college degrees. Under the Biden-Harris Administration, more than 1.6 million manufacturing and construction jobs have been created and American workers are rebuilding roads and bridges using materials made in America. Three times more auto jobs per month have been created under their watch than under the Trump Administration—even before the pandemic. And with these investments, the Biden-Harris Administration is showing how America can meet the moment and build the industries of the future while creating high-quality union jobs in the electric vehicle and battery supply chains. \n\nAs President, Kamala Harris will build on this Administration’s progress to ensure American industries and workers thrive. Vice President Harris will continue to support American leadership in semiconductors, clean energy, AI, and other cutting edge industries of the future. She’ll also fight for unions, because as Vice President of the most pro-labor administration in history, she knows that unions are the backbone of the middle class. She’ll sign landmark pro-union legislation, including the PRO Act to support workers who choose to organize and bargain and the Public Service Freedom to Negotiate Act to make the freedom for public service workers to form unions the law of the land. During her leadership as Vice President, unions representing those from auto workers to truck drivers to care workers won record wage increases amidst record job creation with clear support for the right to collectively bargain from the White House. Vice President Harris will not tolerate unfair trade practices from China or any competitor that undermines American workers.\n\nShe’ll fight to raise the minimum wage, end sub-minimum wages for tipped workers and people with disabilities, establish paid family and medical leave, and eliminate taxes on tips for service and hospitality workers. \n\nProvide a Pathway to the Middle Class Through Quality, Affordable Education\nVice President Harris will fight to ensure parents can afford high-quality child care and preschool for their children. She will strengthen public education and training as a pathway to the middle class. And she’ll continue working to end the unreasonable burden of student loan debt and fight to make higher education more affordable, so that college can be a ticket to the middle class. To date, Vice President Harris has helped deliver the largest investment in public education in American history, provide nearly $170 billion in student debt relief for almost five million borrowers, and deliver record investments in HBCUs, Tribal Colleges, Hispanic-Serving Institutions, and other minority-serving institutions. She helped more students afford college by increasing the maximum Pell Grant award by $900 — the largest increase in more than a decade — and invested in community colleges. She has implemented policies that have led to over one million registered apprentices being hired, and she will do even more to scale up programs that create good career pathways for non-college graduates. \n\nInvest in Affordable Child Care and Long Term Care\nVice President Harris cast the deciding vote on the American Rescue Plan, which made historic investments in the care economy. As President, she will fight to lower care costs for American families, including by expanding high-quality home care services for seniors and people with disabilities and ensuring hardworking families can afford high-quality child care, all while ensuring that care workers are paid a living wage and treated with the dignity and respect they deserve.\n\nLower Energy Costs and Tackle the Climate Crisis\nAs Attorney General, Kamala Harris won tens of millions in settlements against Big Oil and held polluters accountable. As Vice President, she cast the tie-breaking vote to pass the Inflation Reduction Act, the largest investment in climate action in history. This historic work is lowering household energy costs, creating hundreds of thousands of high-quality clean energy jobs, and building a thriving clean energy economy, all while ensuring America’s energy security and independence with record energy production. As President, she will unite Americans to tackle the climate crisis as she builds on this historic work, advances environmental justice, protects public lands and public health, increases resilience to climate disasters, lowers household energy costs, creates millions of new jobs, and continues to hold polluters accountable to secure clean air and water for all. As the Vice President said at the international climate conference, COP28, she knows that meeting this global challenge will require global cooperation and she is committed to continuing and building upon the United States’ international climate leadership. She and Governor Walz will always fight for the freedom to breathe clean air, drink clean water, and live free from the pollution that fuels the climate crisis. \n\nTrump’s Project 2025 Agenda\nVice President Harris’ lowering costs agenda is a stark contrast to Donald Trump’s plans to jack up prices, weaken the middle class, cut Social Security and Medicare, eliminate the Department of Education and preschool programs like Head Start, and end the Affordable Care Act. Project 2025 would give him unprecedented control to implement his destructive agenda, including another handout to his billionaire friends and giant corporations. His plans would increase costs for families by at least $3,900 a year by slapping a Trump sales tax on imported everyday goods that American families rely on, like gas, food, clothing, and medicine. Trump would raise rents and add $1,200 a year to the typical American mortgage. Trump asked Big Oil executives to give his campaign money so he could roll back regulations and cut taxes for Big Oil to boost their profits, and Trump’s plans would push gas prices up. Trump’s economic plans would also trigger a recession by mid-2025, cost America over 3 million jobs, threaten hundreds of thousands of clean energy jobs, increase the debt by over $5 trillion, send inflation skyrocketing, and hurt everyone but the richest Americans. \n\nSAFEGUARD OUR FUNDAMENTAL FREEDOMS  \nVice President Harris’ fight for our future is also a fight for freedom. In this election, many fundamental freedoms are at stake: the freedom to make your own decisions about your own body without government interference; the freedom to love who you love openly and with pride; and the freedom that unlocks all the others: the freedom to vote.  \n\nRestore and Protect Reproductive Freedoms\nVice President Harris and Governor Walz trust women to make decisions about their own bodies, and not have the government tell them what to do.\n\nDonald Trump handpicked members of the United States Supreme Court to take away reproductive freedom – and now he brags about it. In his words, “I did it, and I’m proud to have done it.” He even called for punishment for women who have an abortion. \n\nSince Roe v. Wade was overturned, Vice President Harris has driven the Administration’s strategy to defend reproductive freedom and safeguard the privacy of patients and providers. As Governor, Tim Walz led Minnesota to become the first state to pass a law protecting a woman’s right to choose following the overturning of Roe. Vice President Harris has traveled America and heard the stories of women hurt by Trump abortion bans. Stories of couples just trying to grow their family, cut off in the middle of IVF treatments. Stories of women miscarrying in parking lots, developing sepsis, losing the ability to ever have children again — all because doctors are afraid they may go to jail for caring for their patients. As President, she will never allow a national abortion ban to become law. And when Congress passes a bill to restore reproductive freedom nationwide, she will sign it.\n\nProtect Civil Rights and Freedoms\nVice President Harris and Governor Walz believe many fundamental freedoms are at stake in this election. They will fight to ensure that Americans have the opportunity to participate in our democracy by passing the John Lewis Voting Rights and the Freedom to Vote Acts — laws that will enshrine voting rights protections, expand vote-by-mail and early voting, and more. Her Administration will also continue to protect Americans from discrimination, building on her work to secure $2 billion in funding for Offices of Civil Rights across the federal government. And as President, she’ll always defend the freedom to love who you love openly and with pride.  In 2004, she officiated some of the nation’s first same-sex marriages and as Attorney General, she refused to defend California’s anti-marriage equality statewide referendum. As President, she’ll fight to pass the Equality Act to enshrine anti-discrimination protections for LGBTQI+ Americans in health care, housing, education, and more into law. \n\nTrump’s Project 2025 Agenda\nDonald Trump is a threat to our fundamental rights and freedoms. He brags that he is “proudly” responsible for handpicking Supreme Court Justices who overturned Roe, unleashing Trump Abortion Bans in states across the country, putting women’s lives at risk and threatening doctors and other health providers with jail time. He said there should be “punishment” for women who have an abortion and calls abortion bans “a beautiful thing to watch.” If elected, Trump will ban abortion nationwide, restrict access to birth control, force states to report on women’s miscarriages and abortions, and jeopardize access to IVF.\n\nTrump and his allies continue to demonize and attack LGBTQI+ individuals and families. His Project 2025 agenda will eliminate federal rules that protect LGBTQI+ Americans from discrimination. And Trump is directly attacking the bedrock of our democracy: the right to vote. His baseless claims of a stolen election in 2020 inspired states to slash voter protections and purge their voting rolls. \n\nENSURE SAFETY AND JUSTICE FOR ALL  \nAs a prosecutor, district attorney, and attorney general, Kamala Harris has fought to ensure everyone has the right to safety, to dignity, and to justice. Everyone should have the freedom to live in safe communities — that’s why Vice President Harris is fighting to keep our communities safe from gun violence and crime, secure our borders and fix our broken immigration system, tackle the opioid and fentanyl crisis, and ensure no one is above the law — including the president.\n\nMake Our Communities Safer From Gun Violence and Crime\nAs a prosecutor, Vice President Harris fought violent crime by getting illegal guns and violent criminals off California streets. During her time as District Attorney, she raised conviction rates for violent offenders — including gang members, gun felons, and domestic abusers. As Attorney General, Vice President Harris built on this record, removing over 12,000 illegal guns from the streets of California and prosecuting some of the toughest transnational criminal organizations in the world. \n\nIn the White House, Vice President Harris helped deliver the largest investment in public safety ever, investing $15 billion in supporting local law enforcement and community safety programs across 1,000 cities, towns, and counties. President Biden and Vice President Harris encouraged bipartisan cooperation to pass the first major gun safety law in nearly 30 years, which included record funding to hire and train over 14,000 mental health professionals for our schools. As head of the first-ever White House Office of Gun Violence Prevention, she spearheaded policies to expand background checks and close the gun show loophole. Under her and President Biden’s leadership, violent crime is at a 50-year low, with the largest single-year drop in murders ever.\n\nAs President, she won’t stop fighting so that Americans have the freedom to live safe from gun violence in our schools, communities, and places of worship. She’ll ban assault weapons and high-capacity magazines, require universal background checks, and support red flag laws that keep guns out of the hands of dangerous people. She will also continue to invest in funding law enforcement, including the hiring and training of officers and people to support them, and will build upon proven gun violence prevention programs that have helped reduce violent crime throughout the country. \n\nSecure Our Borders and Fix Our Broken Immigration System\nVice President Harris and Governor Walz believe in tough, smart solutions to secure the border, keep communities safe, and reform our broken immigration system. As Attorney General of California, Vice President Harris went after international drug gangs, human traffickers and cartels that smuggled guns, drugs, and human beings across the U.S.-Mexico border. As Vice President, she supported the bipartisan border security bill, the strongest reform in decades. The legislation would have deployed more detection technology to intercept fentanyl and other drugs and added 1,500 border security agents to protect our border. After Donald Trump killed the border deal for his political gain, she and President Biden took action on their own — and now border crossings are at the lowest level in 4 years, their administration is seizing record amounts of fentanyl, and secured funding for the most significant increase in border agents in ten years. As President, she will bring back the bipartisan border security bill and sign it into law. At the same time, she knows that our immigration system is broken and needs comprehensive reform that includes strong border security and an earned pathway to citizenship.\n\nTackle the Opioid and Fentanyl Crisis\nVice President Harris is committed to ending the opioid epidemic and tackling the scourge of fentanyl. She’s seen the devastating impact of fentanyl on families up close — she has met and mourned with those who have lost loved ones to fentanyl overdoses. As Attorney General, she prosecuted drug traffickers, seizing over 10,000 kilos of cocaine and 12,000 pounds of methamphetamine. In the White House, she helped direct more than $150 billion to disrupt the flow of illicit drugs and delivered billions of dollars in investments to states to fund lifesaving programs. Under the Biden-Harris Administration, the FDA made the overdose-reversal drug naloxone available over-the-counter. This past year, the number of overdose deaths in the United States declined for the first time in five years. As President, she will sign the bipartisan border bill that will fund detection technology to intercept even more illicit drugs and she’ll keep fighting to end the opioid epidemic.\n\nEnsure No One Is Above the Law\nVice President Harris believes that no one is above the law. She’ll fight to ensure that no former president has immunity for crimes committed while in the White House. She will also support common-sense Supreme Court reforms — like requiring Justices to comply with ethics rules that other federal judges are bound by and imposing term limits — to address the crisis of confidence facing the Supreme Court.\n\nTrump’s Project 2025 Agenda\nDonald Trump is a convicted criminal who only cares about himself. He’s proven that time and time again — from caving to the gun lobby and doing nothing to address gun violence to killing the bipartisan border security deal that would secure our border and keep America safe, just to help himself politically. If elected president, Trump will implement his Project 2025 agenda to consolidate power, bring the Department of Justice and the FBI under his direct control so he can give himself unchecked legal power and go after his opponents, and rule as a dictator on “day one.” Not only will Trump fail to tackle violence in our communities or fix our broken immigration system — he will make us less safe. He says we should “get over” gun violence and he is pushing for more guns on our streets and wants to arm teachers in our classrooms. He’ll advance his cruel immigration agenda which includes separating children from their parents. And he is refusing to commit to accepting the results of the 2024 election if he loses a second time.\n\nKEEP AMERICA SAFE, SECURE, AND PROSPEROUS\nVice President Harris will never waver in defense of America’s security and ideals. As Vice President, she has confronted threats to our security, negotiated with foreign leaders, strengthened our alliances, and engaged with our brave troops overseas. As Commander In Chief, she will ensure that the United States military remains the strongest, most lethal fighting force in the world, that we unleash the power of American innovation and win the competition for the 21st century, and that we strengthen, not abdicate, our global leadership. And Vice President Harris will fulfill our sacred obligation to care for our troops and their families, and will always honor their service and their sacrifice.\n\nStand With Our Allies, Stand Up to Dictators, and Lead on the World Stage\nVice President Harris is ready to be Commander in Chief on day one. She has helped restore American leadership on the world stage, strengthened our national security through her travels to 21 countries and meetings with more than 150 world leaders, defended American values and democracy, and advanced America’s interests. \n\nVice President Harris has been a tireless and effective diplomat on the world stage. She has met with China’s Xi Jinping, making clear she will always stand up for American interests in the face of China’s threats, and traveled to the Indo-Pacific four times to advance our economic and security partnerships. She visited the Korean Demilitarized Zone to affirm our unwavering commitment to South Korea in the face of North Korean threats. Five days before Russia attacked Ukraine, she met with President Zelenskyy to warn him about Russia’s plan to invade and helped mobilize a global response of more than 50 countries to help Ukraine defend itself against Vladimir Putin’s brutal aggression. And she has worked with our allies to ensure NATO is stronger than ever.  \n\nVice President Harris will never hesitate to take whatever action is necessary to protect U.S. forces and interests from Iran and Iran-backed terrorist groups. Vice President Harris will always stand up for Israel’s right to defend itself and she will always ensure Israel has the ability to defend itself. She and President Biden are working to end the war in Gaza, such that Israel is secure, the hostages are released, the suffering in Gaza ends, and the Palestinian people can realize their right to dignity, security, freedom, and self-determination. She and President Biden are working around the clock to get a hostage deal and a ceasefire deal done.\n\nFrom advising on tough decisions in the Oval Office and the Situation Room, to serving on the Senate Select Committee on Intelligence, to going after transnational criminal organizations as California’s Attorney General, Vice President Harris brings extensive national security experience — and it’s no surprise more than 350 foreign policy and national security experts have endorsed her. \n\nInvest in America’s Sources of Strength\nVice President Harris will make sure that America, not China, wins the competition for the 21st century and that we strengthen, not abdicate, our global leadership. She will invest in the competitive advantages that make America the strongest nation on Earth — American workers, innovation, and industry — and will work to ensure America remains a leader in the industries of the future, from semiconductors to clean energy to artificial intelligence. She has stood up to China’s unfair economic practices to protect American workers, businesses, and families. And she has advanced our economic cooperation around the world, from rallying international leaders at an AI summit in the UK, to convening semiconductor business leaders in East Asia, to spurring private investment across Africa.\n\nSupport Service Members, Veterans, Their Families, Caregivers, and Survivors\nVice President Harris and Governor Walz believe we have a sacred obligation to care for our nation’s service members, veterans, their families, caregivers, and survivors. These Americans represent the bravest among us who have put their lives on the line to defend the promise of America, stand up for our values, and protect our fundamental freedoms. Vice President Harris and President Biden have delivered the most significant expansion of benefits and services for veterans exposed to burn pits, Agent Orange, and other toxic substances in more than 30 years. The son of an Army veteran who served as a command sergeant major, Governor Walz was the ranking member on the House Veterans Affairs Committee, where he passed legislation to help stem veterans’ suicides.\n\nThey will fight to end veteran homelessness, investing in mental health and suicide prevention efforts, and eliminating barriers to employment and expanding economic opportunity for military and veteran families. A Harris-Walz Administration will continue to ensure that service members, veterans and their families receive the benefits they have earned.\n\nTrump’s Project 2025 Agenda\nSomeone as dangerous as Donald Trump should never again be allowed to serve as Commander in Chief. In office, he cozied up to dictators and turned his back on allies. He undercut America’s competitive edge, boasting that not a single American factory would close under his watch, and then doing nothing as factories shuttered. He’s said he would let Russia “do whatever the hell they want” to our NATO allies. And he calls soldiers who gave their lives in defense of American democracy “suckers” and “losers.” Top American military generals and national security officials — including those who worked for Trump — have warned that he is “dangerous” and “unfit” to lead, and now he is surrounded by ultra-loyalists who enable his worst impulses.
    `,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      listStocks: {
        description: 'List three imaginary stocks that are trending.',
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe('The symbol of the stock'),
              price: z.number().describe('The price of the stock'),
              delta: z.number().describe('The change in price of the stock')
            })
          )
        }),
        generate: async function* ({ stocks }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'listStocks',
                    toolCallId,
                    args: { stocks }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'listStocks',
                    toolCallId,
                    result: stocks
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stocks props={stocks} />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          delta: z.number().describe('The change in price of the stock')
        }),
        generate: async function* ({ symbol, price, delta }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockPrice',
                    toolCallId,
                    args: { symbol, price, delta }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockPrice',
                    toolCallId,
                    result: { symbol, price, delta }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{ symbol, price, delta }} />
            </BotCard>
          )
        }
      },
      showStockPurchase: {
        description:
          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          numberOfShares: z
            .number()
            .optional()
            .describe(
              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
            )
        }),
        generate: async function* ({ symbol, price, numberOfShares = 100 }) {
          const toolCallId = nanoid()

          if (numberOfShares <= 0 || numberOfShares > 1000) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      args: { symbol, price, numberOfShares }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      result: {
                        symbol,
                        price,
                        numberOfShares,
                        status: 'expired'
                      }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'system',
                  content: `[User has selected an invalid amount]`
                }
              ]
            })

            return <BotMessage content={'Invalid amount'} />
          } else {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      args: { symbol, price, numberOfShares }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      result: {
                        symbol,
                        price,
                        numberOfShares
                      }
                    }
                  ]
                }
              ]
            })

            return (
              <BotCard>
                <Purchase
                  props={{
                    numberOfShares,
                    symbol,
                    price: +price,
                    status: 'requires_action'
                  }}
                />
              </BotCard>
            )
          }
        }
      },
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        generate: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'getEvents',
                    toolCallId,
                    args: { events }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getEvents',
                    toolCallId,
                    result: events
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state, done }) => {
    'use server'

    if (!done) return

    const session = await auth()
    if (!session || !session.user) return

    const { chatId, messages } = state

    const createdAt = new Date()
    const userId = session.user.id as string
    const path = `/chat/${chatId}`

    const firstMessageContent = messages[0].content as string
    const title = firstMessageContent.substring(0, 100)

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      createdAt,
      messages,
      path
    }

    await saveChat(chat)
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
