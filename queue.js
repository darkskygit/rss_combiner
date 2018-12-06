module.exports = function PromiseQueue(queue = [], threadnum = os.cpus.length || 4) {
	return new Promise(onReturn => {
		let result = []
		const thread = function(threadId) {
			return new Promise(resolve => {
				const onFinal = function(ret) {
					if (threads[threadId] instanceof Promise) {
						threads[threadId] = thread(threadId)
					}
					if (ret) result.push(ret)
					resolve()
				}
				if (queue.length > 0) {
					let func = queue.pop()
					if (typeof func === 'function' && (typeof func.retry !== 'number' || func.retry < 3)) {
						let promise = func()
						if (promise instanceof Promise) {
							return promise.then(onFinal).catch(err => {
								func.errmsg = func.errmsg || []
								func.errmsg.push(err)
								func.retry = (Number(func.retry) | 0) + 1
								queue.push(func)
								onFinal()
							})
						}
					}
					if (Array.isArray(func.errmsg)) {
						func.errmsg.forEach(err => console.log(err))
					}
					onFinal()
				} else onReturn(result)
			})
		}
		let threads = Array(threadnum)
			.fill(thread)
			.map((callback, i) => callback(i))
	})
}