import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association
    frame: {
      version: "1",
      name: "Monad Farcaster MiniApp Template",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "template"],
      primaryCategory: "developer-tools",
      buttonTitle: "Launch Template",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,

      "accountAssociation": {
        "header": "eyJmaWQiOjEyODA1NDgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNkFmMzdBZmJjMzg4MmMyMTM4ZGJBOTcyNWYzOTdCMUE2ZkRGNzA1In0",
        "payload": "eyJkb21haW4iOiJ0cm9sbG1ldHJ5LnZlcmNlbC5hcHAifQ",
        "signature": "ojbL+IjBLLYj1M090IlsVzBqrL7JN7wMCiqQDYI5z7hGV5Zaz1UlZMlkUyslhcB8klbHNUOLz6QOFQu9PnkqJxs="
      }
    },
  };

  return NextResponse.json(farcasterConfig);
}
