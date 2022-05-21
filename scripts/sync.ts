import { basename, extname } from "https://deno.land/std@0.127.0/node/path.ts";

interface APIResponse<T> {
  data: T;
}

interface DKCard {
  cardId: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface CardsQueryResult {
  cards: {
    total: number;
    records: DKCard[];
  };
}

const query = await Deno.readTextFile("./gql/cards.graphql");

const res = await fetch("https://api.duelistking.com/graphql", {
  headers: {
    ["content-type"]: "application/json",
  },
  method: "POST",
  body: JSON.stringify({
    operationName: "Query",
    variables: {
      filterInput: {
        offset: 0,
        limit: 80,
        order: [{ column: "cardId", order: "asc" }],
      },
    },
    query,
  }),
});

const json: APIResponse<CardsQueryResult> = await res.json();
const cards = json.data.cards.records;

await Promise.all(
  cards.map(async ({ imageUrl }) => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const lowercased = res.url.toLowerCase();
    const dest = `../src/images/${basename(lowercased)}`;
    return blob.stream().pipeTo(Deno.createSync(dest).writable);
  })
);

interface Image {
  jpg: string;
  webp: string;
}

interface Card {
  cardId: string;
  name: string;
  description: string;
  image: Image;
}

await Deno.writeTextFile(
  "../src/data/cards.json",
  JSON.stringify(
    cards.reduce((acc, { imageUrl, ...card }) => {
      const lowercased = imageUrl.toLowerCase();
      const base = basename(lowercased);
      const ext = extname(lowercased);
      acc[card.cardId] = {
        ...card,
        image: {
          jpg: `/images/${base.replace(ext, ".jpg")}`,
          webp: `/images/${base.replace(ext, ".webp")}`,
        },
      };
      return acc;
    }, {} as Record<string, Card>)
  )
);
