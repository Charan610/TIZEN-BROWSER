# Samsung TV search repair

Goal: Samsung Done submits text and opens an actual browser rather than a blocked search iframe.

Decision: Keep the existing WGT and launcher UI. Use the TV's native IME and public Tizen view app-control for web navigation. Samsung Internet owns browsing after handoff; this WGT does not become a separate full browser engine. Retain the embedded viewer as an explicitly limited option and for the local diagnostic page.

- [x] Reproduce Samsung Done failing to submit in a real browser using keycode 65376.
- [ ] Share input submission across home/toolbar; handle Done, cancel, composition, Enter and Go without duplicate submissions. Let native input receive remote keys.
- [ ] Route HTTP(S) navigation to Samsung Internet with visible success/error, retry, and limited embed option. Validate native launch URLs.
- [ ] Check real DOM flows with a mocked Tizen API, native launch errors, local page, and URL normalization. Run existing tests and rebuild version 1.0.2.
- [ ] Review changes and verify final WGT resources and privileges. Physical TV validation remains external.
