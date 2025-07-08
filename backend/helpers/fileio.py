import pickle
import json

"""library"""

def fix_json_data(data):
    """make object can be dumped, by replacing special class into class_name."""
    if isinstance(data, list):
        for i, e in enumerate(data):
            data[i] = fix_json_data(data[i])
        return data
    elif isinstance(data, dict):
        for k, v in data.items():
            data[k] = fix_json_data(v)
        return data
    elif isinstance(data, str) | isinstance(data, int) | isinstance(data, float):
        return data
    else:
        return f'=={data.__class__.__name__}=='


"""export"""

def save_lines(fn, lines):
    with open(fn, 'w', encoding='utf8') as fo:
        for l in lines:
            fo.write(f'{l}\n')


def load_lines(fn):
    with open(fn, 'r', encoding='utf8') as fi:
        return [line.strip() for line in fi.readlines()]


def save_json(fn, data):
    with open(fn, 'w', encoding='utf8') as fo:
        json.dump(data, fo, indent=2, ensure_ascii=False)


def load_json(fn):
    """load json data from trans-10.json file, and store in data"""
    with open(fn, 'r', encoding='utf8') as f:
        data = json.load(f)
    return data


def save_pkl(fn, data):
    with open(fn, 'wb') as fo:
        pickle.dump(data, fo)


def load_pkl(fn):
    with open(fn, 'rb') as fi:
        return pickle.load(fi)
