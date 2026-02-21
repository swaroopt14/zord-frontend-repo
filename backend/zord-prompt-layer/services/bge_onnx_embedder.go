//go:build onnx
// +build onnx

package services

import (
	"fmt"
	"math"
	"os"

	"github.com/sugarme/tokenizer"
	"github.com/sugarme/tokenizer/pretrained"
	onnx "github.com/yalue/onnxruntime_go"
)

type BGEONNXEmbedder struct {
	tok               *tokenizer.Tokenizer
	session           *onnx.DynamicSession[int64, float32]
	inputIDsName      string
	attentionMaskName string
	tokenTypeIDsName  string
	outputName        string
	maxLength         int
	hiddenDim         int
}

func NewBGEONNXEmbedder(
	modelPath string,
	tokenizerPath string,
	inputIDsName string,
	attentionMaskName string,
	tokenTypeIDsName string,
	outputName string,
	maxLength int,
) (*BGEONNXEmbedder, error) {
	tok, err := pretrained.FromFile(tokenizerPath)
	if err != nil {
		return nil, fmt.Errorf("load tokenizer: %w", err)
	}
	onnxLib := os.Getenv("ONNXRUNTIME_SHARED_LIBRARY_PATH")
	if onnxLib != "" {
		onnx.SetSharedLibraryPath(onnxLib)
	}

	// NOTE: shared-library path may be needed in runtime env.
	// e.g. onnx.SetSharedLibraryPath("C:\\path\\to\\onnxruntime.dll")
	if !onnx.IsInitialized() {
		if err := onnx.InitializeEnvironment(); err != nil {
			return nil, fmt.Errorf("init onnx env: %w", err)
		}
	}

	sess, err := onnx.NewDynamicSession[int64, float32](
		modelPath,
		[]string{inputIDsName, attentionMaskName, tokenTypeIDsName},
		[]string{outputName},
	)
	if err != nil {
		return nil, fmt.Errorf("create onnx session: %w", err)
	}

	return &BGEONNXEmbedder{
		tok:               tok,
		session:           sess,
		inputIDsName:      inputIDsName,
		attentionMaskName: attentionMaskName,
		tokenTypeIDsName:  tokenTypeIDsName,
		outputName:        outputName,
		maxLength:         maxLength,
		hiddenDim:         384, // bge-small-en-v1.5
	}, nil
}

func (e *BGEONNXEmbedder) Embed(text string) ([]float32, error) {
	enc, err := e.tok.EncodeSingle(text, true)
	if err != nil {
		return nil, fmt.Errorf("tokenize: %w", err)
	}

	inputIDs := intsToInt64(enc.Ids)
	attn := make([]int64, len(inputIDs))
	typeIDs := make([]int64, len(inputIDs))
	for i := range inputIDs {
		attn[i] = 1
		typeIDs[i] = 0
	}

	inputIDs = fixLen(inputIDs, e.maxLength)
	attn = fixLen(attn, e.maxLength)
	typeIDs = fixLen(typeIDs, e.maxLength)

	inShape := onnx.NewShape(1, int64(e.maxLength))
	inputTensor, err := onnx.NewTensor(inShape, inputIDs)
	if err != nil {
		return nil, err
	}
	defer inputTensor.Destroy()

	attnTensor, err := onnx.NewTensor(inShape, attn)
	if err != nil {
		return nil, err
	}
	defer attnTensor.Destroy()

	typeTensor, err := onnx.NewTensor(inShape, typeIDs)
	if err != nil {
		return nil, err
	}
	defer typeTensor.Destroy()

	outShape := onnx.NewShape(1, int64(e.maxLength), int64(e.hiddenDim))
	outData := make([]float32, e.maxLength*e.hiddenDim)
	outTensor, err := onnx.NewTensor(outShape, outData)
	if err != nil {
		return nil, err
	}
	defer outTensor.Destroy()

	err = e.session.Run(
		[]*onnx.Tensor[int64]{inputTensor, attnTensor, typeTensor},
		[]*onnx.Tensor[float32]{outTensor},
	)
	if err != nil {
		return nil, fmt.Errorf("onnx run: %w", err)
	}

	hidden := outTensor.GetData()
	vec := meanPool(hidden, attn, e.maxLength, e.hiddenDim)
	normalize(vec)
	return vec, nil
}

func intsToInt64(in []int) []int64 {
	out := make([]int64, len(in))
	for i, v := range in {
		out[i] = int64(v)
	}
	return out
}

func fixLen(in []int64, n int) []int64 {
	if len(in) == n {
		return in
	}
	if len(in) > n {
		return in[:n]
	}
	out := make([]int64, n)
	copy(out, in)
	return out
}

func meanPool(hidden []float32, attn []int64, seqLen, dim int) []float32 {
	out := make([]float32, dim)
	var count float32
	for t := 0; t < seqLen; t++ {
		if attn[t] == 0 {
			continue
		}
		base := t * dim
		for d := 0; d < dim; d++ {
			out[d] += hidden[base+d]
		}
		count++
	}
	if count > 0 {
		for d := 0; d < dim; d++ {
			out[d] /= count
		}
	}
	return out
}

func normalize(v []float32) {
	var sum float64
	for _, x := range v {
		sum += float64(x * x)
	}
	n := float32(math.Sqrt(sum))
	if n == 0 {
		return
	}
	for i := range v {
		v[i] /= n
	}
}
