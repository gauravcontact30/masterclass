import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TechBuzzFeed } from "@/components/tech-buzz-feed";
import { TechBuzzArticleView } from "@/components/tech-buzz-article-view";
import { LanguageProvider } from "@/components/language-provider";
import { getTechBuzzArticles, getTrendingTechBuzzArticles } from "@/lib/tech-buzz-data";

describe("Tech Buzz Feed & Multi-Platform Integrations", () => {
  beforeEach(() => {
    localStorage.clear();
    window.scrollTo = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ account: { tier: "free", subscription: null } })
    });
  });

  test("loads Tech Buzz articles and trending section with star ratings", () => {
    const articles = getTechBuzzArticles();
    expect(articles.length).toBeGreaterThanOrEqual(8);

    const trending = getTrendingTechBuzzArticles();
    expect(trending.length).toBe(6);

    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    // Verify Hero title & eyebrow
    expect(screen.getAllByText(/Master Class Buddy • Blogs/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Stay curious/i)).toBeInTheDocument();

    // Verify Star ratings are present on trending and feed cards
    const starRatings = screen.getAllByTitle(/ratings\)/i);
    expect(starRatings.length).toBeGreaterThan(0);
  });

  test("directly opens blogs dashboard without signin or signup flow and provides direct platform subscription", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    // Direct access to blogs dashboard without any sign in or sign up flow
    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Join Community" })).not.toBeInTheDocument();

    // Direct platform subscribe CTA is present
    const subscribeBtn = screen.getByRole("button", { name: /Subscribe to Platform/i });
    expect(subscribeBtn).toBeInTheDocument();

    // Clicking subscribe activates platform membership directly
    fireEvent.click(subscribeBtn);
    expect(screen.getByText(/Subscribed Member/i)).toBeInTheDocument();
  });

  test("allows searching blogs by technology or keyword", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    const searchInput = screen.getByRole("textbox", { name: /Search tech blogs/i });
    fireEvent.change(searchInput, { target: { value: "PostgreSQL" } });

    const mainFeed = screen.getByRole("main");
    expect(mainFeed).toHaveTextContent(/PostgreSQL 17 as a Universal Vector Database/i);
    expect(mainFeed).not.toHaveTextContent(/Scaling to 10M WebSockets/i);
  });

  test("allows filtering blogs by category pill", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    const aiButton = screen.getByRole("tab", { name: "Artificial Intelligence" });
    fireEvent.click(aiButton);

    const matches = screen.getAllByText(/How Anthropic's Model Context Protocol/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("switches between platform formats including Platform Matrix and supports layout toggle & pagination", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    // Test layout change switch toggle: switch to Zero-Noise
    const zeroNoiseBtn = screen.getByRole("button", { name: "Compact zero-noise list view" });
    fireEvent.click(zeroNoiseBtn);
    expect(zeroNoiseBtn).toHaveAttribute("aria-pressed", "true");

    // Switch back to Magazine
    const magazineBtn = screen.getByRole("button", { name: "Magazine card view" });
    fireEvent.click(magazineBtn);
    expect(magazineBtn).toHaveAttribute("aria-pressed", "true");

    // Navigate to page 3 of format inspirations where Platform Matrix is located
    const page3Btn = screen.getByRole("button", { name: "3" });
    fireEvent.click(page3Btn);

    // Click on Platform Matrix format card
    const matrixTab = screen.getByRole("button", { name: /Platform Matrix/i });
    fireEvent.click(matrixTab);

    // The comparison table from the user's screenshot should now be rendered
    expect(screen.getByText(/The Top Developer Content & Blogging Platforms/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-noise ranked news feed/i)).toBeInTheDocument();
    expect(screen.getByText(/Active developer community/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom domains with built-in traffic/i)).toBeInTheDocument();
    expect(screen.getByText(/Total control over email audience/i)).toBeInTheDocument();
  });

  test("opens interactive star rating dialog and updates rating", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    // Click on a star rating container to open rating dialog
    const rateTriggers = screen.getAllByTitle(/Click to rate this blog/i);
    fireEvent.click(rateTriggers[0]);

    // Verify modal appeared
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Rate this technology blog/i)).toBeInTheDocument();

    // Select 5 stars
    const star5 = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(star5);

    // Submit rating
    const submitBtn = screen.getByRole("button", { name: /Submit Rating/i });
    fireEvent.click(submitBtn);

    // Dialog should be closed
    expect(screen.queryByText(/Rate this technology blog/i)).not.toBeInTheDocument();
  });

  test("opens full article reader with Medium-style paywall and unlocks with membership", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    const storyTitles = screen.getAllByText(/How Anthropic's Model Context Protocol/i);
    fireEvent.click(storyTitles[0]);

    // Dialog reader opens
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Back to Master Class Buddy - Blogs/i)).toBeInTheDocument();

    // Visitor sees paywall
    expect(screen.getByText(/Read the full story with a Master Class Buddy membership/i)).toBeInTheDocument();
    const subscribeBtn = screen.getByRole("button", { name: /Subscribe to Platform — Unlock Story/i });
    expect(subscribeBtn).toBeInTheDocument();

    // Click to subscribe directly
    fireEvent.click(subscribeBtn);

    // Now full access banner is visible and paywall is removed
    expect(screen.getByText(/You have full access to this story as a Master Class Buddy member/i)).toBeInTheDocument();
    expect(screen.queryByText(/Read the full story with a Master Class Buddy membership/i)).not.toBeInTheDocument();

    // Close reader
    const backBtn = screen.getByRole("button", { name: /Back to Master Class Buddy - Blogs/i });
    fireEvent.click(backBtn);

    expect(screen.queryByText(/Back to Master Class Buddy - Blogs/i)).not.toBeInTheDocument();
  });

  test("clapping increments claps count and shows toast", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    const clapButtons = screen.getAllByTitle(/Clap for this blog/i);
    fireEvent.click(clapButtons[0]);

    // Toast should appear
    expect(screen.getByText(/Clapped!/i)).toBeInTheDocument();
  });

  test("triggers audio voiceover player when Audio button is clicked", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    const audioBtns = screen.getAllByRole("button", { name: /m Audio/i });
    fireEvent.click(audioBtns[0]);

    // Audio player bar should appear
    expect(screen.getByText(/MasterClass Voiceover/i)).toBeInTheDocument();
  });

  test("subsequent article page renders Medium-style layout and unlocks with direct subscription without signin/up", () => {
    const article = getTechBuzzArticles()[0];

    render(
      <LanguageProvider>
        <TechBuzzArticleView article={article} />
      </LanguageProvider>
    );

    // Verify title and author
    expect(screen.getByText(article.title)).toBeInTheDocument();
    expect(screen.getAllByText(article.author.name).length).toBeGreaterThanOrEqual(1);

    // Verify no sign in or sign up redirection flow
    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Join Community" })).not.toBeInTheDocument();

    // Unsubscribed visitor sees Medium-style paywall
    expect(screen.getByText(/Read the full story with a Master Class Buddy subscription/i)).toBeInTheDocument();

    // Click subscribe on the subsequent article page
    const subscribeBtn = screen.getByRole("button", { name: /Subscribe to Platform — Instant Access/i });
    fireEvent.click(subscribeBtn);

    // Deep-dive content is now unlocked
    expect(screen.getByText(/You have full subscriber access to this story and all code labs/i)).toBeInTheDocument();
    expect(screen.queryByText(/Read the full story with a Master Class Buddy subscription/i)).not.toBeInTheDocument();
  });

  test("renders 10 blogs pagination controls and Move to top button in TechBuzzFeed footer", () => {
    render(
      <LanguageProvider>
        <TechBuzzFeed />
      </LanguageProvider>
    );

    // Verify pagination nav exists
    const paginationNav = screen.getByRole("navigation", { name: /Blog articles pagination/i });
    expect(paginationNav).toBeInTheDocument();

    // Verify 10 blogs per page pagination summary shows Page 1 of ...
    expect(screen.getAllByText(/Page 1 of/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/technology blogs/i).length).toBeGreaterThanOrEqual(1);

    // Verify Move to top button in footer
    const moveToTopBtn = screen.getByRole("button", { name: "Move to top" });
    expect(moveToTopBtn).toBeInTheDocument();
    fireEvent.click(moveToTopBtn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

