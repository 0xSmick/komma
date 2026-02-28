cask "komma" do
  version "0.1.0"
  sha256 "PLACEHOLDER"

  url "https://github.com/komma-app/komma/releases/download/v#{version}/Komma-#{version}-arm64.dmg"
  name "Komma"
  desc "AI-powered document editor for writers"
  homepage "https://github.com/komma-app/komma"

  depends_on macos: ">= :ventura"

  app "Komma.app"

  zap trash: [
    "~/.komma",
    "~/Library/Application Support/Komma",
    "~/Library/Preferences/com.komma.app.plist",
  ]
end
