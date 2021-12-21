<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, onUnmounted, ref } from "vue";
import DuelistKingCard from "./components/DuelistKingCard.vue";
import { getId } from "./utils/dkc";

interface Tx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

interface Response<T> {
  status: string;
  message: string;
  result: T;
}

const loading = ref(false);
const inputAddress = ref("");
const message = ref("");
const txs = ref<Record<string, number>>({});

const totalCount = computed(() =>
  Object.keys(txs.value).reduce((acc, id) => acc + txs.value[id], 0)
);

const totalCountFormatted = computed(() => {
  return Intl.NumberFormat().format(totalCount.value);
});

const createQuery =
  (source: string, contractaddress: string) => async (address: string) => {
    const params = {
      module: "account",
      action: "tokennfttx",
      contractaddress,
      address,
      startblock: "0",
      endblock: "999999999",
      sort: "asc",
    };
    return axios.get<Response<Tx[] | string>>(`https://api.${source}.com/api`, {
      timeout: 60000,
      params,
    });
  };

const DKC_ADDRESS = "0xc44b1022f4895f3c04e965f8a82437a8b5cebb70";
const DKC_URL = `https://ftmscan.com/token/${DKC_ADDRESS}`;
const ftmQuery = createQuery("ftmscan", DKC_ADDRESS);

const DKDAOI_ADDRESS = "0xb5c01956842cE3a658109776215F86CA4FeE2CBc";
const DKDAOI_URL = `https://polygonscan.com/token/${DKDAOI_ADDRESS}`;
const polygonQuery = createQuery("polygonscan", DKDAOI_ADDRESS);

async function getQuery(address: string) {
  if (loading.value) return;

  loading.value = true;
  message.value = "";

  try {
    const responses = await Promise.all([
      ftmQuery(address),
      polygonQuery(address),
    ]);

    const lowercased = address.toLowerCase();

    function count(acc: Record<string, number>, tx: Tx) {
      const id = getId(tx.tokenID);
      if (!(id in acc)) acc[id] = 0;

      if (tx.to === lowercased) acc[id] += 1;
      else if (tx.from === lowercased) acc[id] -= 1;
      return acc;
    }

    txs.value = responses.reduce((acc, res) => {
      const { result } = res.data;
      if (typeof result === "string") throw new Error(result);
      return result.reduce(count, acc);
    }, {} as Record<string, number>);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      message.value = err.response?.data.message;
    } else if (err instanceof Error) {
      message.value = err.message;
    }
  } finally {
    loading.value = false;
  }
}

async function query(address: string) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("address") !== address) {
    const data = { address };
    window.history.pushState(
      data,
      "",
      `/?${new URLSearchParams(data).toString()}`
    );
  }

  await getQuery(address);
}

async function queryFromURL() {
  const params = new URLSearchParams(window.location.search);
  const address = params.get("address") as string;
  if (params.has("address") && address !== inputAddress.value) {
    inputAddress.value = address;
    await getQuery(address);
  }
}

onMounted(async () => {
  queryFromURL();

  window.addEventListener("popstate", queryFromURL);
});

onUnmounted(() => {
  window.removeEventListener("popstate", queryFromURL);
});
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-10 bg-white border-b">
    <div
      class="
        container
        mx-auto
        py-4
        px-4
        sm:px-6
        lg:px-8
        flex
        items-center
        space-between
      "
    >
      <a class="font-bold text-lg" href="#">Duelist King Card</a>
      <div class="ml-auto">
        <a
          class="opacity-70 hover:opacity-100 font-medium text-sm"
          href="https://github.com/wpj3/dkc"
        >
          <span>View on GitHub </span>
          <svg
            version="1.1"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            class="inline-block align-text-top"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            ></path>
          </svg>
        </a>
      </div>
    </div>
  </header>

  <div class="container mx-auto py-20 px-4 sm:px-6 lg:px-8">
    <h1
      class="
        text-3xl
        tracking-tight
        font-extrabold
        text-gray-900
        sm:text-5xl
        md:text-6xl
      "
    >
      Duelist King Card
    </h1>
    <p
      class="
        mt-3
        mx-auto
        text-base text-gray-500
        sm:mt-5 sm:text-lg
        md:mt-5 md:text-xl
      "
    >
      An unofficial inventory check for Duelist King NFTs (<a
        class="font-medium text-red-500 hover:text-red-700"
        :href="DKDAOI_URL"
        >DKDAOI</a
      >
      and
      <a class="font-medium text-red-500 hover:text-red-700" :href="DKC_URL"
        >DKC</a
      >)
    </p>

    <div class="flex justify-center mt-5">
      <input
        type="text"
        name="address"
        class="
          w-96
          p-1
          mr-2
          bg-white
          border-b-2 border-red-600
          bg-transparent
          outline-none
          text-sm text-center
          font-medium
          text-gray-500
          disabled:opacity-50
        "
        placeholder="Wallet address"
        :disabled="loading"
        v-model.trim="inputAddress"
      />
      <button
        type="button"
        class="
          bg-red-600
          border border-transparent
          rounded-md
          py-2
          px-4
          flex
          text-base
          font-medium
          text-white
          disabled:opacity-50
        "
        :disabled="loading"
        @click="query(inputAddress)"
      >
        {{ loading ? "Please wait..." : "Query" }}
      </button>
    </div>

    <div class="relative">
      <div
        v-if="message"
        class="absolute top-12 left-0 right-0 font-medium text-lg text-center"
      >
        {{ message }}
      </div>

      <div v-if="totalCount > 0" :class="{ 'opacity-10': message || loading }">
        <div class="mt-6 text-lg font-medium text-right">
          Total cards: {{ totalCountFormatted }}
        </div>

        <div
          class="
            mt-4
            grid grid-cols-1
            gap-y-10 gap-x-6
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5 xl:gap-x-8
          "
        >
          <DuelistKingCard
            v-for="(count, id) in txs"
            :key="id"
            :id="id"
            :count="count"
          />
        </div>

        <p class="mt-4 text-left text-base">
          Data retrieved from
          <a
            class="text-red-500 hover:text-red-700"
            href="https://polygonscan.com/apis#accounts"
            >polygonscan</a
          >
          and
          <a
            class="text-red-500 hover:text-red-700"
            href="https://ftmscan.com/apis#accounts"
            >ftmscan</a
          >
        </p>
      </div>
    </div>
  </div>
</template>

<style>
html {
  height: 100%;
}

body {
  min-height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
