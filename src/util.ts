import { Setter as LensSetter, Getter as LensGetter } from "@dhmk/zustand-lens";
import { PropType } from "@dhmk/utils";
import { Draft, Patch, produce, produceWithPatches } from "immer";

type A = (
  nextStateOrUpdater:
    | { name: string }
    | Partial<{ name: string }>
    | ((state: Draft<{ name: string }>) => void),
  shouldReplace?: boolean | undefined
) => void;

type SetterCallback<T> = (state: Draft<T>) => void;

type Setter<T> = (
  partial: Partial<T> | ((state: Draft<T>) => void),
  replace?: boolean
) => void;

type SetterWithPatches<T> = (
  callback: SetterCallback<T>
) => [boolean, Patch[], Patch[]];

type CreateWithImmerReturn<T, P extends string[]> = {
  set: Setter<PropType<T, P>>;
  setWithPatches: SetterWithPatches<PropType<T, P>>;
  get: LensGetter<PropType<T, P>>;
};

function createWithImmer<T, P extends string[]>(
  params: [LensSetter<PropType<T, P>>, LensGetter<PropType<T, P>>]
): CreateWithImmerReturn<T, P> {
  const [setLens, getLens] = params;

  function set(callback: SetterCallback<PropType<T, P>>): void {
    setLens((state) => {
      return produce(state, (draft) => {
        callback(draft);
      });
    });
  }

  function setWithPatches(
    callback: SetterCallback<PropType<T, P>>
  ): [boolean, Patch[], Patch[]] {
    let isDirty: boolean;
    let patches: Patch[];
    let inversePatches: Patch[];

    setLens((state) => {
      const [nextState, patchesInner, inversePatchesInner] = produceWithPatches(
        state,
        (draft) => {
          callback(draft);
        }
      );

      isDirty = nextState !== state;
      patches = patchesInner;
      inversePatches = inversePatchesInner;

      return nextState;
    });

    return [isDirty!, patches!, inversePatches!];
  }

  return {
    set,
    setWithPatches,
    get: getLens,
  };
}

export { createWithImmer };
