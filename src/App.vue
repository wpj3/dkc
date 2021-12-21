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

const DKC_ADDRESS = "0xc44b1022f4895f3c04e965f8a82437a8b5cebb70";

const loading = ref(false);
const inputAddress = ref("");
const message = ref("");
const txs = ref<Record<string, number>>({});

const totalCount = computed(() => {
  const count = Object.keys(txs.value).reduce(
    (acc, id) => acc + txs.value[id],
    0
  );
  return Intl.NumberFormat().format(count);
});

async function getQuery(address: string) {
  if (loading.value) return;

  loading.value = true;
  message.value = "";

  const params = {
    module: "account",
    action: "tokennfttx",
    contractaddress: DKC_ADDRESS,
    address,
    startblock: "0",
    endblock: "999999999",
    sort: "asc",
  };

  try {
    const res = await axios.get<Response<Tx[] | string>>(
      "https://api.ftmscan.com/api",
      {
        timeout: 60000,
        params,
      }
    );
    const { status, result } = res.data;
    if (typeof result === "string") {
      throw new Error(result);
    } else if (status === "1") {
      const lowercased = address.toLowerCase();

      txs.value = result.reduce((acc, tx) => {
        const id = getId(tx.tokenID);
        if (!(id in acc)) acc[id] = 0;

        if (tx.to === lowercased) acc[id] += 1;
        else if (tx.from === lowercased) acc[id] -= 1;
        return acc;
      }, {} as Record<string, number>);
    }
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
  if (params.has("address") && params.get("address") !== address) {
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
  if (params.has("address")) {
    const address = params.get("address") as string;
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
  <div class="container mx-auto py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
    <h1 class="text-4xl mb-4 font-bold">Duelist King Card</h1>
    <div class="flex justify-center">
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
    <div v-if="message" class="mt-1 text-sm text-blue-600">
      {{ message }}
    </div>

    <div class="mt-6 text-xl font-medium">Total cards: {{ totalCount }}</div>
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
  </div>
</template>

<style>
html {
  height: 100%;
}

body {
  min-height: 100%;
  background: #efefef;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
