import { Alert, Button, Field, FormGrid, Modal, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { createInteractionSchema, updateInteractionSchema } from "@/schemas/interaction.schema";
import { interactionsService } from "@/services";
import type { DrugSummary, Interaction, Severity } from "@/types";
import { DrugPair } from "./DrugPair";
import { DrugPicker } from "./DrugPicker";
import { SeverityPicker } from "./SeverityPicker";

interface Props {
    interaction?: Interaction;
    onClose: () => void;
    onSaved: () => void;
}

const DESCRIPTION_PLACEHOLDER = "Masalan: qon ketish xavfini oshiradi, shifokor bilan maslahatlashing";

export function InteractionFormModal({ interaction, onClose, onSaved }: Props) {
    return interaction ? (
        <EditInteraction interaction={interaction} onClose={onClose} onSaved={onSaved} />
    ) : (
        <CreateInteraction onClose={onClose} onSaved={onSaved} />
    );
}

function Footer({ onClose, submitting }: { onClose: () => void; submitting: boolean }) {
    return (
        <>
            <Button onClick={onClose}>Bekor qilish</Button>
            <Button type="submit" variant="primary" loading={submitting}>
                Saqlash
            </Button>
        </>
    );
}

function CreateInteraction({ onClose, onSaved }: Omit<Props, "interaction">) {
    const toast = useToast();
    const form = useZodForm(createInteractionSchema, { drugA: null, drugB: null, severity: "YELLOW", description: "" });
    const { values, errors, set } = form;

    const submit = () =>
        form.submit(async ({ drugA, drugB, severity, description }) => {
            await interactionsService.create({ drugAId: drugA!.id, drugBId: drugB!.id, severity, description: description || undefined });
            toast.success("O'zaro ta'sir qo'shildi");
            onSaved();
            onClose();
        });

    return (
        <Modal title="Yangi o'zaro ta'sir" onClose={onClose} onSubmit={submit} footer={<Footer onClose={onClose} submitting={form.submitting} />}>
            {form.formError && <Alert>{form.formError}</Alert>}
            <FormGrid>
                <DrugPicker label="1-dori" value={values.drugA as DrugSummary | null} onChange={set("drugA")} error={errors.drugA} excludeId={values.drugB?.id} />
                <DrugPicker label="2-dori" value={values.drugB as DrugSummary | null} onChange={set("drugB")} error={errors.drugB} excludeId={values.drugA?.id} />
            </FormGrid>
            <SeverityPicker value={values.severity as Severity} onChange={set("severity")} error={errors.severity} />
            <Field label="Izoh (bemorga ko'rsatiladi)" error={errors.description}>
                <Textarea value={values.description} onChange={(e) => set("description")(e.target.value)} placeholder={DESCRIPTION_PLACEHOLDER} />
            </Field>
        </Modal>
    );
}

function EditInteraction({ interaction, onClose, onSaved }: Props & { interaction: Interaction }) {
    const toast = useToast();
    const form = useZodForm(updateInteractionSchema, { severity: interaction.severity, description: interaction.description ?? "" });
    const { values, errors, set } = form;

    const submit = () =>
        form.submit(async ({ severity, description }) => {
            await interactionsService.update(interaction.id, { severity, description: description || null });
            toast.success("Yozuv yangilandi");
            onSaved();
            onClose();
        });

    return (
        <Modal title="O'zaro ta'sirni tahrirlash" onClose={onClose} onSubmit={submit} footer={<Footer onClose={onClose} submitting={form.submitting} />}>
            {form.formError && <Alert>{form.formError}</Alert>}
            <div className="card card--compact">
                <DrugPair a={interaction.drugA} b={interaction.drugB} />
            </div>
            <SeverityPicker value={values.severity as Severity} onChange={set("severity")} error={errors.severity} />
            <Field label="Izoh (bemorga ko'rsatiladi)" error={errors.description}>
                <Textarea value={values.description} onChange={(e) => set("description")(e.target.value)} placeholder={DESCRIPTION_PLACEHOLDER} />
            </Field>
        </Modal>
    );
}
