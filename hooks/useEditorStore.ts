import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';
import { StickerElement, TextElement } from '@/types';

interface CanvasSize {
    width: number;
    height: number;
}

interface StoreState {
    stickers: StickerElement[];
    availableStickers: { name: string; src: string; }[];
    textElements: TextElement[];
    currentTextInput: string;
    bgImageObj: HTMLImageElement | null;
    canvasSize: CanvasSize;
    maxZIndex: number;
    setStickers: (stickers: StickerElement[] | ((prev: StickerElement[]) => StickerElement[])) => void;
    setAvailableStickers: (
        stickers: { name: string; src: string; }[] | ((prev: { name: string; src: string; }[]) => { name: string; src: string; }[])
    ) => void;
    setTextElements: (elements: TextElement[] | ((prev: TextElement[]) => TextElement[])) => void;
    setCurrentTextInput: (text: string) => void;
    setBgImageObj: (image: HTMLImageElement | null) => void;
    setCanvasSize: (size: CanvasSize) => void;
    bringToFront: (elementId: string, elementType: 'text' | 'sticker') => void;
    setMaxZIndex: (zIndex: number) => void;
    clearSelectedStickers: () => void;
    update: (updateData: UpdateOptions) => void;
}

type UpdateOptions = Partial<Pick<StoreState, 'stickers' | 'availableStickers' | 'textElements' | 'currentTextInput' | 'bgImageObj' | 'canvasSize' | 'maxZIndex'>>;

export const useEditorStore = create<StoreState>()(
    subscribeWithSelector(
        temporal(
            (set, get) => ({
                stickers: [],
                availableStickers: [
                    { name: 'Sticker ', src: '/sticker.svg' },
                    { name: 'Sticker s', src: '/s.svg' },
                    { name: 'Sticker 1', src: '/1.svg' },
                    { name: 'Sticker 2', src: '/2.svg' },
                    { name: 'Sticker 3', src: '/3.svg' },
                    { name: 'Sticker 4', src: '/4.svg' },
                    { name: 'Sticker 5', src: '/5.svg' },
                    { name: 'Sticker 6', src: '/6.svg' },
                ],
                textElements: [],
                currentTextInput: '',
                bgImageObj: null,
                canvasSize: { width: 1024, height: 700 }, // Default canvas size
                maxZIndex: 0,

                // Update functions
                setStickers: (stickers) => set((state) => ({
                    stickers: typeof stickers === 'function' ? stickers(state.stickers) : stickers,
                })),
                setAvailableStickers: (stickers) => set((state) => ({
                    availableStickers: typeof stickers === 'function' ? stickers(state.availableStickers) : stickers,
                })),
                setTextElements: (elements) => set((state) => ({
                    textElements: typeof elements === 'function' ? elements(state.textElements) : elements,
                })),
                setCurrentTextInput: (text) => set({ currentTextInput: text }),
                setBgImageObj: (image) => set({ bgImageObj: image }),
                setCanvasSize: (size) => set({ canvasSize: size }),
                setMaxZIndex: (zIndex) => set({ maxZIndex: zIndex }),

                // Bringing element to front
                bringToFront: (elementId, elementType) => {
                    const state = get();
                    const newZIndex = state.maxZIndex + 1;

                    if (elementType === 'text') {
                        set({
                            textElements: state.textElements.map(el =>
                                el.id === elementId ? { ...el, zIndex: newZIndex } : el
                            ),
                            maxZIndex: newZIndex
                        });
                    } else if (elementType === 'sticker') {
                        set({
                            stickers: state.stickers.map(sticker =>
                                sticker.id === elementId ? { ...sticker, zIndex: newZIndex } : sticker
                            ),
                            maxZIndex: newZIndex
                        });
                    }
                },

                // Clearing selected stickers
                clearSelectedStickers: () => {
                    set({
                        stickers: get().stickers.map(el => ({ ...el, isSelected: false }))
                    });
                },

                update: (updateData) => {
                    set((state) => ({
                        stickers: updateData.stickers ?? state.stickers,
                        availableStickers: updateData.availableStickers ?? state.availableStickers,
                        textElements: updateData.textElements ?? state.textElements,
                        currentTextInput: updateData.currentTextInput ?? state.currentTextInput,
                        bgImageObj: updateData.bgImageObj ?? state.bgImageObj,
                        canvasSize: updateData.canvasSize ?? state.canvasSize,
                        maxZIndex: updateData.maxZIndex ?? state.maxZIndex,
                    }));
                }

            }),
            {
                partialize: (state) => ({
                    stickers: state.stickers,
                    textElements: state.textElements,
                    maxZIndex: state.maxZIndex,
                    bgImageObj: state.bgImageObj
                }),
                limit: 50,
                equality: (pastState, currentState) =>
                    JSON.stringify(pastState) === JSON.stringify(currentState),
            }
        )
    )
);

export const useUndoRedoStore = () => {
    const { undo, redo, clear } = useEditorStore.temporal.getState();
    return { undo, redo, clear };
};