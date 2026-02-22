import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TryPanel } from "../src/components/TryPanel";
import { fakerRuntimeClient } from "../src/pyodide/client";

const formatter = {
  name: "name",
  provider_module: "faker.providers.person",
  provider_class: "Provider",
  source: "builtin",
  signature: "()",
  doc: "Generate name",
  parameters: []
};

describe("TryPanel", () => {
  it("generates output and renders preview", async () => {
    const ensureRuntime = vi.fn(async () => undefined);
    const generateSpy = vi.spyOn(fakerRuntimeClient, "generate").mockResolvedValue(["Ada Lovelace", "Grace Hopper"]);

    render(
      <TryPanel
        open
        formatter={formatter}
        locales={["en_US"]}
        ensureRuntime={ensureRuntime}
        onClose={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(ensureRuntime).toHaveBeenCalledTimes(1);
      expect(generateSpy).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();

    generateSpy.mockRestore();
  });
});
