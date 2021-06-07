from sagemaker_inference import content_types, decoder, default_inference_handler, encoder, errors
import torch
from .nlp.srl.label import to_labeler, serialize_frames
import os
from typing import *
from .nlp.srl.common import Frame
import json


class SRLInferenceHandler(default_inference_handler.DefaultInferenceHandler):

    def default_model_fn(self, model_dir):
        """Loads a model. For PyTorch, a default function to load a model cannot be provided.
        Users should provide customized model_fn() in script.

        Args:
            model_dir: a directory where model is saved.

        Returns: A PyTorch model.
        """
        verbto = os.path.join(model_dir, os.environ['VERB_ONTO'])
        predto = os.path.join(model_dir, os.environ['PRED_ONTO'])
        verbnom = os.path.join(model_dir, os.environ['VERB_NOM'])
        prednom = os.path.join(model_dir, os.environ['PRED_NOM'])
        return to_labeler(verbto, verbnom, predto, prednom, 'cuda:0')

    def default_input_fn(self, input_data: str, content_type):
        """A default input_fn that can handle JSON, CSV and NPZ formats.

        Args:
            input_data: the request payload serialized in the content_type format
            content_type: the request content_type

        Returns: input_data deserialized into torch.FloatTensor or torch.cuda.FloatTensor depending if cuda is available.
        """
        if content_type == content_types.JSON:
            return json.loads(input_data)
        else:
            print('not a handled format')
            return 

    def default_predict_fn(self, data, model) -> List[Frame]:
        """A default predict_fn for PyTorch. Calls a model on data deserialized in input_fn.
        Runs prediction on GPU if cuda is available.

        Args:
            data: input data (torch.Tensor) for prediction deserialized by input_fn
            model: PyTorch model loaded in memory by model_fn

        Returns: a prediction (list of frames)
        """
        return model.label(data)

    def default_output_fn(self, prediction, accept):
        """A default output_fn for PyTorch. Serializes predictions from predict_fn to JSON, CSV or NPY format.

        Args:
            prediction: a prediction result from predict_fn
            accept: type which the output data needs to be serialized

        Returns: output data serialized
        """
        return serialize_frames(prediction, [x for x in range(len(prediction))], [''] * len(prediction), 'chat')