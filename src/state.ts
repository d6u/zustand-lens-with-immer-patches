import { Patch, applyPatches } from "immer";
import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import { createLens, withLenses, lens } from "@dhmk/zustand-lens";
import { createWithImmer } from "./util";

type ConfigState = {
  counter: number;
};

type StackState = {
  isDirty: boolean;
  patchesArray: Patch[][];
  inversePatchesArray: Patch[][];
};

type State = {
  config: ConfigState;
  stack: StackState;
};

type Action = {
  increment: () => void;
  undo: () => void;
};

type StoreShape = State & Action;

export const useStore = create<StoreShape>(
  withLenses((set, get) => {
    const { set: setConfig, setWithPatches: setConfigWithPatches } =
      createWithImmer<StoreShape, ["config"]>(createLens(set, get, ["config"]));

    const { set: setStack } = createWithImmer<StoreShape, ["stack"]>(
      createLens(set, get, "stack")
    );

    return {
      config: lens<ConfigState>(() => ({
        counter: 1,
      })),

      stack: lens<StackState>(() => ({
        isDirty: false,
        patchesArray: [],
        inversePatchesArray: [],
      })),

      increment() {
        const [isDirty, patches, inversePatches] = setConfigWithPatches(
          (config) => {
            config.counter += 1;
          }
        );

        setStack((stack) => {
          stack.isDirty = isDirty;
          stack.patchesArray.push(patches);
          stack.inversePatchesArray.push(inversePatches);
        });
      },

      undo() {
        setStack((stack) => {
          const inversePatch = stack.inversePatchesArray.pop();
          if (inversePatch) {
            stack.isDirty = true;
            setConfig((config) => applyPatches(config, inversePatch));
          }
        });
      },
    };
  })
);

create<{ name: string }>()((set, get) => {
  return {
    name: "Hello",
  };
});
