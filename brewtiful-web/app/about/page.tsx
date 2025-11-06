export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-4 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:mb-4 prose-ul:my-4 prose-li:my-2">
          <h1 className="text-foreground">About Brewtiful</h1>

          <div className="bg-muted/50 rounded-lg p-6 my-8 border border-border">
            <h2 className="!mt-0 !mb-4">What is Brewtiful?</h2>
            <p className="!mb-0">
              Brewtiful is a machine learning-powered beer recommendation app that helps you discover new beers
              you&apos;ll love based on your taste preferences.
            </p>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <h1>Who made this?</h1>

            <div className="space-y-6">
              I (Lucas Lyons) made Brewtiful to teach myself more about recommender systems, machine learning, and software development in general. 
              My personal page is <a href="https://lucaslyons.github.io/" className="text-primary underline">here</a>. It&apos;s where you can find more information about me,
              if you&apos;re really that curious.
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <h2>How it works</h2>

            <div className="space-y-6">
              If you want to learn about how Brewtiful works, I made a <a href="https://lucaslyons.github.io/portfolio/brewtiful" className="text-primary underline">blog post</a> going into detail.
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <h2>You have too much free time.</h2>
            <p>
              I&apos;m trying to learn some useful skills! Cut me some slack.
            </p>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <h2>Will you add XYZ feature?</h2>
            <p>
              Probably not. I already spent too much time on this project and there are many other things to learn!
            </p>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <h2>Why am I still reading this?</h2>
            <p>
              Go find a new beer to try! Maybe you&apos;re the one with too much free time.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
