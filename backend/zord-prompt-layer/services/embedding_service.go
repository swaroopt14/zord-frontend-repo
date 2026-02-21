// Embedder = local BGE ONNX later
// Pipeline calls an embedder now.
// Later you replace only StubEmbedder with ONNX-backed BGEEmbedder
package services

type Embedder interface {
	Embed(text string) ([]float32, error)
}

type StubEmbedder struct{}

func NewStubEmbedder() *StubEmbedder {
	return &StubEmbedder{}
}

func (e *StubEmbedder) Embed(_ string) ([]float32, error) {
	return make([]float32, 384), nil
}
