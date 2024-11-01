import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { ConnectionPlugin } from "rete-connection-plugin";
import { VuePlugin, Presets, VueArea2D } from "rete-vue-plugin";
import CustomButton from "./CustomButton.vue";
import CustomProgress from "./CustomProgress.vue";

class Node extends ClassicPreset.Node<
  Record<string, ClassicPreset.Socket>,
  Record<string, ClassicPreset.Socket>,
  Record<
    string,
    | ButtonControl
    | ProgressControl
    | ClassicPreset.InputControl<"number">
    | ClassicPreset.InputControl<"text">
  >
> {}

class Connection<A extends Node> extends ClassicPreset.Connection<A, A> {}

type Schemes = GetSchemes<Node, Connection<Node>>;
type AreaExtra = VueArea2D<Schemes>;

class ButtonControl extends ClassicPreset.Control {
  constructor(public label: string, public onClick: () => void) {
    super();
  }
}

class ProgressControl extends ClassicPreset.Control {
  constructor(public percent: number) {
    super();
  }
}

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new VuePlugin<Schemes, AreaExtra>();

  render.addPreset(
    Presets.classic.setup({
      customize: {
        control(data) {
          if (data.payload instanceof ButtonControl) {
            return CustomButton;
          }
          if (data.payload instanceof ProgressControl) {
            return CustomProgress;
          }
          if (data.payload instanceof ClassicPreset.InputControl) {
            return Presets.classic.Control;
          }
        }
      }
    })
  );

  editor.use(area);
  area.use(connection);
  area.use(render);

  const a = new Node("A");
  a.addOutput("a", new ClassicPreset.Output(socket));

  const progressControl = new ProgressControl(0);
  const inputControl = new ClassicPreset.InputControl("number", {
    initial: 0,
    change(value) {
      progressControl.percent = value;
      area.update("control", progressControl.id);
    }
  });

  a.addControl("input", inputControl);
  a.addControl("progress", progressControl);
  a.addControl(
    "button",
    new ButtonControl("Randomize", () => {
      const percent = Math.round(Math.random() * 100);

      inputControl.setValue(percent);
      area.update("control", inputControl.id);

      progressControl.percent = percent;
      area.update("control", progressControl.id);
    })
  );
  await editor.addNode(a);

  AreaExtensions.zoomAt(area, editor.getNodes());

  return () => area.destroy();
}
